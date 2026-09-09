CREATE TABLE site_settings (
  key         VARCHAR(80) PRIMARY KEY,   -- 'contact.whatsapp', 'seo.default_og'
  value       JSONB       NOT NULL,
  group_name  VARCHAR(40) NOT NULL DEFAULT 'general',
  updated_by  UUID        REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
