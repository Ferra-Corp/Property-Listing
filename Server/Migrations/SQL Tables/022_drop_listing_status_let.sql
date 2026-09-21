-- Retires the redundant 'let' listing status in favor of 'rented' — both
-- meant a completed tenancy with no functional difference between them.
-- Postgres has no ALTER TYPE ... DROP VALUE, so the enum is rebuilt without
-- it: move any 'let' rows to 'rented' first, then swap the type.

UPDATE listings SET status = 'rented' WHERE status = 'let';

-- Two partial indexes carry a `status = 'published'` predicate baked in
-- against the old type's OID — rebuilding the column's type without first
-- dropping them fails with "operator does not exist: listing_status =
-- listing_status_old", since the stored predicate can't be re-resolved
-- against the renamed type mid-alter. Drop them, swap the type, recreate
-- them identically (verified against pg_indexes) so they re-bind fresh.
DROP INDEX listings_live_idx;
DROP INDEX listings_price_idx;

ALTER TYPE listing_status RENAME TO listing_status_old;

CREATE TYPE listing_status AS ENUM (
  'draft', 'pending_review', 'published', 'under_offer',
  'sold', 'rented', 'withdrawn'
);

ALTER TABLE listings
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE listing_status USING status::text::listing_status,
  ALTER COLUMN status SET DEFAULT 'draft';

DROP TYPE listing_status_old;

CREATE INDEX listings_live_idx ON listings (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX listings_price_idx ON listings (currency_code, price)
  WHERE status = 'published' AND deleted_at IS NULL;
