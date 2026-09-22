import type {
  PropertySubtype,
  PropertyType,
} from "../../Inventory/Listing/listing.types.js";

/**
 * Mirrors the property-kind groups on the homepage's subscribe form and
 * browse filters (`PROPERTY_KIND_OPTIONS` in Client/app/page.tsx) — kept as
 * its own enum rather than reused from Listing, since a subscriber's
 * interest is a coarser grouping than any one subtype (e.g. "office" here
 * covers exactly the "office" subtype, but "go_down_warehouse" covers two).
 */
export type SubscriberInterest =
  | "go_down_warehouse"
  | "office"
  | "retail_showroom"
  | "yard_plot"
  | "residential";

export type Subscriber = {
  id: string;
  email: string;
  interest: SubscriberInterest;
  resend_contact_id: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscribeDTO = {
  email: string;
  interest: SubscriberInterest;
};

export type UpdateSubscriberDTO = {
  interest?: SubscriberInterest;
  /** Lets an admin manually resubscribe someone as well as unsubscribe
   * them — the public link only ever does the latter. */
  unsubscribed?: boolean;
};

/** What a listing-alert email needs, independent of how the recipient list
 * was decided — kept apart from the Listing type so the mail template's
 * variables (all strings, all with a fallback) don't leak into it. */
export type ListingAnnouncement = {
  property_type: PropertyType;
  property_subtype: PropertySubtype | null;
  address: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  link: string;
  propertyType: string;
  photo: string;
};

export interface SubscriberRepository {
  upsertSubscriber: (
    details: SubscribeDTO & { resend_contact_id: string | null },
  ) => Promise<Subscriber>;
  getSubscribers: () => Promise<Subscriber[]>;
  getActiveSubscribersByInterest: (
    interest: SubscriberInterest,
  ) => Promise<Subscriber[]>;
  editSubscriber: (
    id: string,
    details: UpdateSubscriberDTO,
  ) => Promise<Subscriber>;
  /** Returns the row as it stood just before the flip (its
   * `resend_contact_id`, needed to keep Resend's own copy in sync), or
   * null if this id was never a subscriber — unsubscribing twice is a
   * no-op, not an error. */
  unsubscribe: (id: string) => Promise<Subscriber | null>;
  /** Returns the deleted row (again for its `resend_contact_id`), or null
   * if it was already gone. */
  deleteSubscriber: (id: string) => Promise<Subscriber | null>;
}

export interface SubscriberService {
  subscribe: (details: SubscribeDTO) => Promise<void>;
  notifyListingPublished: (listing: ListingAnnouncement) => Promise<void>;
  getSubscribers: () => Promise<Subscriber[]>;
  editSubscriber: (id: string, details: UpdateSubscriberDTO) => Promise<Subscriber>;
  unsubscribe: (id: string) => Promise<void>;
  deleteSubscriber: (id: string) => Promise<void>;
}
