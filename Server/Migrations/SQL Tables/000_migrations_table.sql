CREATE TABLE migrations(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

--- Enums
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TYPE user_role AS ENUM ('admin', 'agent', 'editor', 'viewer');
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'industrial', 'land');
CREATE TYPE property_subtype AS ENUM (
  -- residential
  'apartment', 'townhouse', 'villa', 'maisonette', 'bungalow', 'studio',
  -- commercial
  'office', 'retail', 'shop', 'showroom', 'mixed_use',
  -- industrial
  'go_down', 'warehouse', 'industrial_park', 'yard',
  -- land
  'plot', 'farm', 'development_site'
);
CREATE TYPE listing_purpose AS ENUM ('sale', 'rent', 'lease');
CREATE TYPE price_period AS ENUM (
  'total', 'per_month', 'per_year', 'per_sqft_month', 'per_sqft_year', 'per_acre'
);
CREATE TYPE listing_status AS ENUM (
  'draft', 'pending_review', 'published', 'under_offer',
  'sold', 'rented', 'let', 'withdrawn'
);
CREATE TYPE area_unit AS ENUM ('sqft', 'sqm', 'acre', 'hectare');
CREATE TYPE media_type AS ENUM (
  'image', 'video', 'floor_plan', 'virtual_tour', 'brochure'
);
CREATE TYPE lead_intent AS ENUM (
  'buy', 'rent', 'lease', 'sell', 'valuation', 'general'
);
CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'viewing_booked',
  'negotiating', 'won', 'lost', 'spam'
);
CREATE TYPE lead_source AS ENUM (
  'contact_form', 'listing_enquiry', 'valuation_form', 'viewing_form',
  'whatsapp', 'phone', 'email', 'referral', 'other'
);
CREATE TYPE request_status AS ENUM (
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
);
CREATE TYPE property_condition AS ENUM ('good', 'average', 'poor');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'bounced');