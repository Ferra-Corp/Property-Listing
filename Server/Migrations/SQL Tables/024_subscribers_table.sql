-- Newsletter/listing-alert signups from the homepage footer form. One row
-- per email — re-subscribing with a different interest just updates the
-- existing row rather than creating a second one. `resend_contact_id` is
-- kept so a later change can look the contact up without a search; it's
-- nullable because the local signup still succeeds even if the Resend call
-- fails (email capture shouldn't depend on a third party being up).
CREATE TABLE subscribers (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email               CITEXT       NOT NULL,
  interest            TEXT         NOT NULL,
  resend_contact_id   TEXT,
  unsubscribed_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX subscribers_email_uq ON subscribers (email);
CREATE INDEX subscribers_interest_idx ON subscribers (interest)
  WHERE unsubscribed_at IS NULL;
