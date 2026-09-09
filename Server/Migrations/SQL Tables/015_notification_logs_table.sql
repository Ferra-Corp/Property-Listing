CREATE TABLE notification_logs (
  id                  BIGSERIAL PRIMARY KEY,
  channel             VARCHAR(16) NOT NULL,   -- email | whatsapp | sms
  template            VARCHAR(60) NOT NULL,
  recipient           VARCHAR(160) NOT NULL,
  related_type        VARCHAR(40),             -- 'lead' | 'viewing_request' | ...
  related_id          UUID,
  status              notification_status NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notif_failed_idx ON notification_logs (status, created_at DESC)
  WHERE status IN ('failed', 'bounced');
CREATE INDEX notif_rel_idx ON notification_logs (related_type, related_id);