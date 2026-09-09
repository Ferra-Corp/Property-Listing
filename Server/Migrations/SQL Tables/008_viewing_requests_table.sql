CREATE TABLE viewing_requests (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          UUID           NOT NULL REFERENCES listings(id),
  lead_id             UUID           NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  preferred_date      DATE           NOT NULL,
  preferred_time_slot VARCHAR(40),               -- 'morning' | 'afternoon' | '14:30'
  alternate_date      DATE,
  confirmed_at        TIMESTAMPTZ,               -- set on the admin dashboard
  assigned_agent_id   UUID           REFERENCES users(id),
  status              request_status NOT NULL DEFAULT 'pending',
  message             TEXT,                       -- from the visitor
  internal_notes      TEXT,                       -- never rendered publicly
  cancelled_reason    VARCHAR(200),
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT confirmed_has_time CHECK (
    status <> 'confirmed' OR confirmed_at IS NOT NULL
  )
);

CREATE INDEX viewings_diary_idx ON viewing_requests (confirmed_at)
  WHERE status = 'confirmed' AND deleted_at IS NULL;
CREATE INDEX viewings_queue_idx ON viewing_requests (status, created_at DESC);