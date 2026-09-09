CREATE TABLE exchange_rates (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   CHAR(3)        NOT NULL REFERENCES currencies(code),
  target_currency CHAR(3)        NOT NULL REFERENCES currencies(code),
  rate            NUMERIC(18,8)  NOT NULL,
  source          TEXT           NOT NULL,     -- provider name, for auditability
  rate_date       DATE           NOT NULL,
  fetched_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency, rate_date)
);

CREATE INDEX fx_lookup_idx ON exchange_rates (base_currency, target_currency, rate_date DESC);