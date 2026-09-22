import { Resend } from "resend";
import {
  RESEND_KEY,
  RESEND_LISTING_ALERT_TEMPLATE_ID,
  RESEND_SUBSCRIBERS_SEGMENT_ID,
} from "../../Configurations/Env.js";

let resend: Resend | undefined;

const getResendClient = (): Resend => {
  if (!RESEND_KEY)
    throw new Error("RESEND_KEY must be provided in .env to send mail");

  resend ??= new Resend(RESEND_KEY);

  return resend;
};

export const PasswordResetMail = async (email: string, url: string) => {
  try {
    const resetEmail = await getResendClient().emails.send({
      from: "security@ferracorp.com",
      to: email,
      template: {
        id: "ae67403d-92c2-4c65-9630-43526ab0a8bf",
        variables: {
          email,
          link: url,
        },
      },
    });

    if (resetEmail.error) throw new Error(resetEmail.error.message);
  } catch (error) {
    throw error;
  }
};

export const InviteAgent = async (email: string, url: string) => {
  try {
    const invite = await getResendClient().emails.send({
      from: "security@ferracorp.com",
      to: email,
      template: {
        id: "b3f3ad06-03bd-4052-9978-10321a7943be",
        variables: {
          email,
          link: url,
        },
      },
    });

    if (invite.error) throw new Error(invite.error.message);
  } catch (error) {
    throw error;
  }
};

// A contact `properties` value 422s with "One or more properties do not
// exist" until the property itself has been registered on the account at
// least once — there's no dashboard step for that in this project, so it's
// done here, the first time it's needed, and remembered for the life of
// the process. Registering it twice 400s (harmless — swallowed either way).
let interestPropertyEnsured: Promise<void> | null = null;

const ensureInterestProperty = (): Promise<void> => {
  interestPropertyEnsured ??= getResendClient()
    .contactProperties.create({ key: "interest", type: "string" })
    .then(() => undefined)
    .catch(() => undefined);

  return interestPropertyEnsured;
};

/**
 * Adds (or updates) a listing-alert subscriber as a Resend contact in the
 * shared subscribers segment, storing their chosen interest as a custom
 * property so a later publish can filter the segment down to just the
 * matching contacts. Tries an update first — most repeat signups are
 * someone changing their interest, not a new email — and only creates a
 * fresh contact when that 404s.
 */
export const UpsertSubscriberContact = async (
  email: string,
  interest: string,
): Promise<string | null> => {
  if (!RESEND_SUBSCRIBERS_SEGMENT_ID) return null;

  await ensureInterestProperty();

  const client = getResendClient();

  try {
    const updated = await client.contacts.update({
      email,
      properties: { interest },
    });

    if (updated.error) throw new Error(updated.error.message);
    if (updated.data) return updated.data.id;
  } catch {
    // Falls through to create — the update call 404s when the contact
    // doesn't exist yet, which is the common first-signup case.
  }

  const created = await client.contacts.create({
    email,
    properties: { interest },
    segments: [{ id: RESEND_SUBSCRIBERS_SEGMENT_ID }],
  });

  if (created.error) throw new Error(created.error.message);

  return created.data?.id ?? null;
};

/** Flips a contact's `unsubscribed` flag on Resend's side to match a local
 * unsubscribe — best-effort, since the local flip (the part that actually
 * stops further sends from this app) already happened by the time this is
 * called. */
export const MarkContactUnsubscribed = async (
  resendContactId: string,
): Promise<void> => {
  const updated = await getResendClient().contacts.update({
    id: resendContactId,
    unsubscribed: true,
  });

  if (updated.error) throw new Error(updated.error.message);
};

/** Keeps an admin's edit (interest and/or subscribed state) in sync on the
 * Resend side — best-effort, same reasoning as `MarkContactUnsubscribed`. */
export const UpdateSubscriberContact = async (
  resendContactId: string,
  fields: { interest?: string; unsubscribed?: boolean },
): Promise<void> => {
  await ensureInterestProperty();

  const updated = await getResendClient().contacts.update({
    id: resendContactId,
    ...(fields.unsubscribed != null
      ? { unsubscribed: fields.unsubscribed }
      : {}),
    ...(fields.interest != null
      ? { properties: { interest: fields.interest } }
      : {}),
  });

  if (updated.error) throw new Error(updated.error.message);
};

/** Removes a subscriber's contact entirely from Resend — called when the
 * local row is deleted outright, not just unsubscribed. */
export const RemoveSubscriberContact = async (
  resendContactId: string,
): Promise<void> => {
  const removed = await getResendClient().contacts.remove({
    id: resendContactId,
  });

  if (removed.error) throw new Error(removed.error.message);
};

export type ListingAlertVariables = {
  email: string;
  address: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  link: string;
  propertyType: string;
  photo: string;
  unsubscribeLink: string;
};

/** Announces one published listing to one subscriber. The template already
 * has fallback text for any variable left blank (e.g. no photo on file). */
export const ListingAlertMail = async (
  email: string,
  variables: ListingAlertVariables,
) => {
  if (!RESEND_LISTING_ALERT_TEMPLATE_ID)
    throw new Error(
      "RESEND_LISTING_ALERT_TEMPLATE_ID must be provided in .env to send listing alerts",
    );

  const alert = await getResendClient().emails.send({
    from: "listings@ferracorp.com",
    to: email,
    template: {
      id: RESEND_LISTING_ALERT_TEMPLATE_ID,
      variables,
    },
  });

  if (alert.error) throw new Error(alert.error.message);
};
