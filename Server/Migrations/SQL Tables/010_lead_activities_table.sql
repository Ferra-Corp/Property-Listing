CREATE TABLE lead_activities (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES users(id),
  type         VARCHAR(24) NOT NULL,   -- note|call|whatsapp|email|meeting|status_change
  body         TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activities_lead_idx ON lead_activities (lead_id, occurred_at DESC);