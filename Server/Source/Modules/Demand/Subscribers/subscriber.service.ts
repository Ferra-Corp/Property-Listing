import { ServiceError } from "../../../Utilities/Http.js";
import { ErrorMsg } from "../../../Utilities/Logger.js";
import { REDIRECT_LINK } from "../../../../Configurations/Env.js";
import {
  ListingAlertMail,
  MarkContactUnsubscribed,
  RemoveSubscriberContact,
  UpdateSubscriberContact,
  UpsertSubscriberContact,
} from "../../../Utilities/Mail.js";
import type { PropertySubtype } from "../../Inventory/Listing/listing.types.js";
import type {
  ListingAnnouncement,
  SubscribeDTO,
  Subscriber,
  SubscriberInterest,
  SubscriberRepository,
  SubscriberService,
  UpdateSubscriberDTO,
} from "./subscriber.types.js";

const VALID_INTERESTS: SubscriberInterest[] = [
  "go_down_warehouse",
  "office",
  "retail_showroom",
  "yard_plot",
  "residential",
];

/** Which property subtypes fall into each interest group — mirrors
 * `PROPERTY_KIND_OPTIONS` in Client/app/page.tsx. "residential" has no
 * entry here because it's matched by property_type instead of subtype. */
const SUBTYPES_BY_INTEREST: Partial<Record<SubscriberInterest, PropertySubtype[]>> = {
  go_down_warehouse: ["go_down", "warehouse"],
  office: ["office"],
  retail_showroom: ["retail", "showroom"],
  yard_plot: ["yard", "plot"],
};

/** A listing whose type/subtype falls outside every group (e.g. a shop,
 * mixed-use unit, or farm) has no matching audience — same as the
 * homepage's own browse filters, which don't cover them either. */
export function interestForListing(
  listing: Pick<ListingAnnouncement, "property_type" | "property_subtype">,
): SubscriberInterest | null {
  if (listing.property_type === "residential") return "residential";

  if (!listing.property_subtype) return null;

  for (const [interest, subtypes] of Object.entries(SUBTYPES_BY_INTEREST)) {
    if (subtypes!.includes(listing.property_subtype))
      return interest as SubscriberInterest;
  }

  return null;
}

export class SubscriberServ implements SubscriberService {
  constructor(private repo: SubscriberRepository) {}

  async subscribe(details: SubscribeDTO): Promise<void> {
    if (!details?.email || !details?.interest)
      throw new ServiceError("Email and interest must be provided", 400);

    if (!VALID_INTERESTS.includes(details.interest))
      throw new ServiceError("Unrecognized interest", 400);

    let resendContactId: string | null = null;

    try {
      resendContactId = await UpsertSubscriberContact(
        details.email,
        details.interest,
      );
    } catch (error) {
      // The signup itself is the part the visitor is waiting on — Resend
      // being unreachable shouldn't turn into a failed form submission.
      ErrorMsg(error as Error);
    }

    await this.repo.upsertSubscriber({
      email: details.email,
      interest: details.interest,
      resend_contact_id: resendContactId,
    });
  }

  async notifyListingPublished(listing: ListingAnnouncement): Promise<void> {
    const interest = interestForListing(listing);

    if (!interest) return;

    const subscribers = await this.repo.getActiveSubscribersByInterest(interest);

    if (subscribers.length === 0) return;

    const results = await Promise.allSettled(
      subscribers.map((subscriber) =>
        ListingAlertMail(subscriber.email, {
          email: subscriber.email,
          address: listing.address,
          price: listing.price,
          beds: listing.beds,
          baths: listing.baths,
          sqft: listing.sqft,
          description: listing.description,
          link: listing.link,
          propertyType: listing.propertyType,
          photo: listing.photo,
          unsubscribeLink: `${REDIRECT_LINK}/system/unsubscribe?id=${subscriber.id}`,
        }),
      ),
    );

    for (const result of results) {
      if (result.status === "rejected") ErrorMsg(result.reason as Error);
    }
  }

  async unsubscribe(id: string): Promise<void> {
    if (!id) throw new ServiceError("Subscriber id must be provided", 400);

    const subscriber = await this.repo.unsubscribe(id);

    if (subscriber?.resend_contact_id) {
      try {
        await MarkContactUnsubscribed(subscriber.resend_contact_id);
      } catch (error) {
        // The local flip is what actually stops future sends — a failure
        // to also mark it on Resend's side is worth logging, not failing
        // the visitor's unsubscribe request over.
        ErrorMsg(error as Error);
      }
    }
  }

  async getSubscribers(): Promise<Subscriber[]> {
    return this.repo.getSubscribers();
  }

  async editSubscriber(
    id: string,
    details: UpdateSubscriberDTO,
  ): Promise<Subscriber> {
    if (!id) throw new ServiceError("Subscriber id must be provided", 400);

    if (details.interest != null && !VALID_INTERESTS.includes(details.interest))
      throw new ServiceError("Unrecognized interest", 400);

    if (details.interest == null && details.unsubscribed == null)
      throw new ServiceError("Nothing to update", 400);

    const patched = await this.repo.editSubscriber(id, details);

    if (patched.resend_contact_id) {
      try {
        await UpdateSubscriberContact(patched.resend_contact_id, {
          ...(details.interest != null ? { interest: details.interest } : {}),
          ...(details.unsubscribed != null
            ? { unsubscribed: details.unsubscribed }
            : {}),
        });
      } catch (error) {
        ErrorMsg(error as Error);
      }
    }

    return patched;
  }

  async deleteSubscriber(id: string): Promise<void> {
    if (!id) throw new ServiceError("Subscriber id must be provided", 400);

    const deleted = await this.repo.deleteSubscriber(id);

    if (deleted?.resend_contact_id) {
      try {
        await RemoveSubscriberContact(deleted.resend_contact_id);
      } catch (error) {
        ErrorMsg(error as Error);
      }
    }
  }
}
