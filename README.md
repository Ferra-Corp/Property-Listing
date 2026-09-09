# Property Listing Platform — DTO Specification

**Version** 2.0 · **Date** 05 September 2026 · **Supersedes** DTO draft v1 - README.md
**Client** Onyiego Dennis (new entity — name pending) · **Build** Ferra Corporation
**Database** PostgreSQL 14+
**Cache** Redis 2.9.1

---

## Legend

| Tag       | Meaning                                                                   |
| --------- | ------------------------------------------------------------------------- |
| **[A]**   | Tier A — build in v1. Non-negotiable.                                     |
| **[B]**   | Tier B — nice to have. Cut from the bottom up if budget runs out.         |
| **[P2]**  | Phase 2 — specified here so v1 doesn't paint us into a corner. Not built. |
| `NEW`     | Did not exist in v1                                                       |
| `FIXED`   | Existed in v1 but was structurally broken                                 |
| `REVISED` | Existed in v1, materially changed                                         |
| `CUT`     | Was in v1, removed with reason                                            |

---

## Changelog against v1

### Broken in v1 — would have failed at implementation

| Entity                  | Defect                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Agent Profile`         | No `user_id`. Entity was orphaned — no join back to the user it describes, so `Listing.agent_linked` pointed at a user with no reachable public profile. |
| `Listing Media`         | Type enum read **"video or audio"**. No cover flag, no sort order, no alt text. Photos are the client's stated #1 business driver.                       |
| `Roles` / `Permissions` | No join tables (`role_permissions`, `user_roles`) and no role reference on `User`. RBAC was undeliverable as written.                                    |

### Missing from v1

| Entity                                                                | Why it matters                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Lead`                                                                | The client's most-emphasised feature: _"a form where a client comes… this is my mobile number, phone number, location, this is the kind of property I'm looking… I think that's the most important."_ Had no home. |
| `ViewingRequest` / `ValuationRequest`                                 | v1's `Booking` merged two workflows with different fields, lifecycles and admin screens.                                                                                                                           |
| `ExchangeRate` / `Currency`                                           | Currency conversion was confirmed in the meeting and modelled nowhere.                                                                                                                                             |
| `SiteSetting`, `Redirect`, `NotificationLog`                          | Editable contact details, URL-change safety, and proof a lead alert actually reached an agent.                                                                                                                     |
| SEO fields, structured location, currency, lease pricing on `Listing` | The client's #1 stated failure is ranking. v1 had zero SEO scaffolding.                                                                                                                                            |

### Cut from v1

| Entity        | Reason                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Comments`    | Open commentary under a 150–200M KES listing is a defamation, spam and competitor-sabotage vector on a site sold entirely on trust. Never requested by the client. |
| `Favorites`   | Requires the forced registration the lead form exists to avoid. Near-zero use at launch volume. Moved to Phase 2.                                                  |
| RBAC admin UI | Client wants **one designated poster**. `draft → pending_review → published` delivers the quality gate for ~2% of the cost.                                        |

---

## 1. Project Details

A cloud-based real estate property listing website for a **new entity** being registered by Onyiego Dennis, an agent sourcing and listing commercial go-downs, offices, retail space and upmarket residential property for developers and homeowners, handling both **leasing and selling**.

### Constraints agreed in the scoping meeting (05/09/2026)

| Constraint               | Decision                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Platform                 | **Web only.** No mobile app for initial release.                                                                             |
| Payments                 | **Excluded.** Payments are handled by the owner, not the agency. Revisit if the client diversifies into property management. |
| Currency conversion      | **Required.**                                                                                                                |
| Primary contact channels | **Click-to-WhatsApp + email**, plus a lead-intake form. Chatbot is an optional addition.                                     |
| Maps / geolocation       | **Deferred.** Not needed at launch; general location labels only. Lat/long columns exist, unused.                            |
| Listing authorship       | **One designated poster** for quality control. Three agents total.                                                           |
| SEO                      | **Primary objective.** International targeting, specific U.S. states.                                                        |
| Timeline                 | ~1 month to go-live, quality permitting.                                                                                     |
| Budget                   | 90,000–110,000 KES inclusive of annual operations (19,500 KES).                                                              |

### Budget allocation

| Item                                                                 |                 KES |
| -------------------------------------------------------------------- | ------------------: |
| Ceiling                                                              |             110,000 |
| Annual operations (hosting, domain, maintenance, 2–3 email accounts) |              19,500 |
| **Available for build**                                              |          **90,500** |
| Tier A effort                                                        | ~27.5 engineer-days |
| Tier B effort                                                        |  ~7.0 engineer-days |
| **Implied day rate at full scope**                                   |  **~2,870 KES/day** |

> ⚠️ **Commercial decision required before the proposal goes out.** Cutting Tier B to Insights only brings this to ~26 days and ~3,480 KES/day. Neither figure is comfortable. This must be settled by Paul and Michael before Monday, not after sprint one.

---

## 2. Expected Pages

### Public

| Page                                  | Backed by                                     | Tier |
| ------------------------------------- | --------------------------------------------- | ---- |
| Home / landing                        | `listings` (featured), `site_settings`        | A    |
| Listings index — search, filter, sort | `listings`, `listing_media`                   | A    |
| Listing detail                        | `listings`, `listing_media`, `agent_profiles` | A    |
| Agents index                          | `agent_profiles`                              | A    |
| Agent detail                          | `agent_profiles`, `listings`                  | A    |
| About                                 | `site_settings`                               | A    |
| Services                              | `services`                                    | B    |
| Contact / enquiry form                | `leads`                                       | A    |
| Sell or value my property             | `leads`, `valuation_requests`                 | A    |
| Insights index                        | `insights`                                    | B    |
| Insight detail                        | `insights`, `insight_listings`                | B    |

> **Removed from the v1 page list:** the public _User Settings_ page. Enquiries deliberately require **no account**, so there are no public user accounts to have settings for. Re-add only if buyer accounts are introduced in Phase 2 alongside `favorites` and `saved_searches`.
>
> **Also note:** v1 listed _Services_ twice under public pages.

### Admin

| Page                      | Backed by                   | Tier |
| ------------------------- | --------------------------- | ---- |
| Analytics dashboard       | `listing_views`, `leads`    | B    |
| Listings management       | `listings`, `listing_media` | A    |
| Leads inbox               | `leads`, `lead_activities`  | A    |
| Viewing requests / diary  | `viewing_requests`          | A    |
| Valuation requests        | `valuation_requests`        | A    |
| Agents                    | `users`, `agent_profiles`   | A    |
| Insights (CMS)            | `insights`, `tags`          | B    |
| Services                  | `services`                  | B    |
| Site settings             | `site_settings`             | A    |
| Audit log                 | `audit_logs`                | B    |
| My profile                | `users`, `agent_profiles`   | A    |
| ~~Roles and permissions~~ | _Phase 2_                   | P2   |

---

## 3. Conventions

Applied without exception. v1 was inconsistent — five entities were missing one or more timestamps.

| Rule        | Definition                               | Reason                                                                                                            |
| ----------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Primary key | `UUID DEFAULT gen_random_uuid()`         | Non-enumerable. Competitors cannot walk `/listings/1..500` to size the inventory.                                 |
| Timestamps  | `TIMESTAMPTZ`, never `TIMESTAMP`         | Site targets Nairobi and North America simultaneously. Naive timestamps produce wrong viewing times across zones. |
| Every table | `created_at`, `updated_at`, `deleted_at` | Except append-only logs, which carry `created_at` only.                                                           |
| Soft delete | `deleted_at IS NULL`                     | A sold listing keeps its SEO equity and URL. Uniques become partial indexes filtered on this.                     |
| Money       | `NUMERIC(16,2)` + a `currency_code`      | 200,000,000.00 needs 11 digits. Never float. Never a bare amount without its currency.                            |
| Naming      | `snake_case`, plural tables              | Singular columns, `<entity>_id` for every foreign key.                                                            |
| Text        | `VARCHAR(n)` on bounded fields           | Bare `TEXT` only for genuinely unbounded prose.                                                                   |

**Required extensions:** `citext`, `pg_trgm`, `pgcrypto`

---

## 4. Shared Types (Enums)

Declared first — every DTO below depends on them. Property subtypes are taken from the client's own description of his inventory, not a generic template.

| Type                  | Values                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_role`           | `admin`, `agent`, `editor`, `viewer`                                                                                                                                                                              |
| `property_type`       | `residential`, `commercial`, `industrial`, `land`                                                                                                                                                                 |
| `property_subtype`    | `apartment`, `townhouse`, `villa`, `maisonette`, `bungalow`, `studio`, `office`, `retail`, `shop`, `showroom`, `mixed_use`, `go_down`, `warehouse`, `industrial_park`, `yard`, `plot`, `farm`, `development_site` |
| `listing_purpose`     | `sale`, `rent`, `lease`                                                                                                                                                                                           |
| `price_period`        | `total`, `per_month`, `per_year`, `per_sqft_month`, `per_sqft_year`, `per_acre`                                                                                                                                   |
| `listing_status`      | `draft`, `pending_review`, `published`, `under_offer`, `sold`, `rented`, `let`, `withdrawn`                                                                                                                       |
| `area_unit`           | `sqft`, `sqm`, `acre`, `hectare`                                                                                                                                                                                  |
| `media_type`          | `image`, `video`, `floor_plan`, `virtual_tour`, `brochure`                                                                                                                                                        |
| `lead_intent`         | `buy`, `rent`, `lease`, `sell`, `valuation`, `general`                                                                                                                                                            |
| `lead_status`         | `new`, `contacted`, `qualified`, `viewing_booked`, `negotiating`, `won`, `lost`, `spam`                                                                                                                           |
| `lead_source`         | `contact_form`, `listing_enquiry`, `valuation_form`, `viewing_form`, `whatsapp`, `phone`, `email`, `referral`, `other`                                                                                            |
| `request_status`      | `pending`, `confirmed`, `completed`, `cancelled`, `no_show`                                                                                                                                                       |
| `property_condition`  | `good`, `average`, `poor`                                                                                                                                                                                         |
| `content_status`      | `draft`, `published`, `archived`                                                                                                                                                                                  |
| `notification_status` | `queued`, `sent`, `failed`, `bounced`                                                                                                                                                                             |

> **Why `listing_purpose` has three values, not two.** v1 offered "Rented or For sale". The client's core inventory is commercial go-downs, offices and retail space — those are **leased**, priced per square foot per month, with a separate service charge. A two-value enum cannot express the business he actually runs.

---

# DTOs

`ID` (UUID) is implicit on every DTO below unless stated otherwise.

---

## Cluster A — Identity

### User `[A]` `REVISED`

Every human with a login: the admin, the designated poster, and the three agents. **Public visitors never appear here** — they land in `Lead`.

| Field                                      | Type         | Null | Notes                                           |
| ------------------------------------------ | ------------ | ---- | ----------------------------------------------- |
| `name`                                     | varchar(150) | no   |                                                 |
| `email`                                    | citext       | no   | Unique where not deleted. Case-insensitive.     |
| `phone`                                    | varchar(32)  | yes  |                                                 |
| `whatsapp_number`                          | varchar(32)  | yes  | Click-to-WhatsApp is the primary CTA            |
| `password_hash`                            | text         | no   | argon2id, or bcrypt cost 12                     |
| `role`                                     | `user_role`  | no   | Default `viewer`. Replaces v1's RBAC in Tier A. |
| `is_active`                                | boolean      | no   | Default true                                    |
| `email_verified_at`                        | timestamptz  | yes  |                                                 |
| `last_login_at`                            | timestamptz  | yes  |                                                 |
| `failed_login_count`                       | smallint     | no   | Default 0                                       |
| `locked_until`                             | timestamptz  | yes  |                                                 |
| `created_at` / `updated_at` / `deleted_at` | timestamptz  |      |                                                 |

**Indexes:** unique `(email) WHERE deleted_at IS NULL`; `(role) WHERE deleted_at IS NULL`

> `failed_login_count` + `locked_until` is two columns and ~20 lines of middleware. On an admin panel controlling listings worth 150–200M KES, an unthrottled login form is the cheapest way to lose the client's trust permanently.

---

### AgentProfile `[A]` `FIXED`

The public face of each agent. Backs the Agents page and per-agent landing pages, which are real SEO surface area.

| Field                                      | Type              | Null   | Notes                                                         |
| ------------------------------------------ | ----------------- | ------ | ------------------------------------------------------------- |
| **`user_id`**                              | uuid FK → `users` | **no** | **Unique. This was missing in v1 — the entity was orphaned.** |
| `slug`                                     | varchar(160)      | no     | `/agents/dennis-onyiego`                                      |
| `display_name`                             | varchar(150)      | no     |                                                               |
| `title`                                    | varchar(120)      | yes    | e.g. "Commercial Property Consultant"                         |
| `bio`                                      | text              | yes    |                                                               |
| `photo_url`                                | text              | yes    |                                                               |
| `license_number`                           | varchar(64)       | yes    | EARB registration, if displayable                             |
| `phone`                                    | varchar(32)       | yes    |                                                               |
| `whatsapp_number`                          | varchar(32)       | yes    |                                                               |
| `email_public`                             | citext            | yes    |                                                               |
| `specializations`                          | text[]            | no     | Default `{}`. e.g. `{go_downs, retail}`                       |
| `languages`                                | text[]            | no     | Default `{}`                                                  |
| `years_experience`                         | smallint          | yes    |                                                               |
| `linkedin_url`, `instagram_url`            | text              | yes    |                                                               |
| `meta_title`                               | varchar(70)       | yes    |                                                               |
| `meta_description`                         | varchar(180)      | yes    |                                                               |
| `is_active`                                | boolean           | no     | Default true                                                  |
| `sort_order`                               | integer           | no     | Default 0                                                     |
| `created_at` / `updated_at` / `deleted_at` | timestamptz       |        |                                                               |

**Indexes:** unique `(slug) WHERE deleted_at IS NULL`

---

### AuthSession `[A]` `NEW`

| Field                | Type              | Null | Notes                           |
| -------------------- | ----------------- | ---- | ------------------------------- |
| `user_id`            | uuid FK → `users` | no   | Cascade delete                  |
| `refresh_token_hash` | text              | no   | Store the hash, never the token |
| `user_agent`         | text              | yes  |                                 |
| `ip_address`         | inet              | yes  |                                 |
| `expires_at`         | timestamptz       | no   |                                 |
| `revoked_at`         | timestamptz       | yes  |                                 |
| `created_at`         | timestamptz       | no   |                                 |

---

### PasswordResetToken `[A]` `NEW`

| Field        | Type              | Null | Notes          |
| ------------ | ----------------- | ---- | -------------- |
| `user_id`    | uuid FK → `users` | no   | Cascade delete |
| `token_hash` | text              | no   |                |
| `expires_at` | timestamptz       | no   |                |
| `used_at`    | timestamptz       | yes  | Single-use     |
| `created_at` | timestamptz       | no   |                |

> v1 specified a password field but no way to rotate or revoke it.

---

## Cluster B — Inventory

### Listing `[A]` `REVISED — heavily`

One property, in one purpose (sale, rent or lease), at one point in its lifecycle. This is where v1 lost the most ground.

#### Identity

| Field            | Type         | Null | Notes                                                       |
| ---------------- | ------------ | ---- | ----------------------------------------------------------- |
| `reference_code` | varchar(24)  | no   | Unique. `FC-IND-000042`. Agents quote this on calls.        |
| `slug`           | varchar(200) | no   | Unique where not deleted. `go-down-mombasa-road-18000-sqft` |
| `title`          | varchar(200) | no   |                                                             |
| `summary`        | varchar(300) | yes  | Card blurb — not the meta description                       |
| `description`    | text         | no   |                                                             |

#### Classification

| Field              | Type               | Null | Notes                   |
| ------------------ | ------------------ | ---- | ----------------------- |
| `property_type`    | `property_type`    | no   |                         |
| `property_subtype` | `property_subtype` | yes  |                         |
| `purpose`          | `listing_purpose`  | no   | sale / rent / **lease** |
| `status`           | `listing_status`   | no   | Default `draft`         |

#### Location — structured, for geo landing pages and schema.org

| Field                    | Type         | Null | Notes                                    |
| ------------------------ | ------------ | ---- | ---------------------------------------- |
| `country_code`           | char(2)      | no   | Default `KE`                             |
| `state_region`           | varchar(100) | yes  | County, or U.S. state                    |
| `city`                   | varchar(100) | yes  |                                          |
| `neighbourhood`          | varchar(120) | yes  | "Karen", "Westlands"                     |
| `location_label`         | varchar(200) | no   | What the agent types; shown as-is        |
| `address_line`           | varchar(200) | yes  | **Admin-only.** Never rendered publicly. |
| `postal_code`            | varchar(20)  | yes  |                                          |
| `latitude` / `longitude` | numeric(9,6) | yes  | Present but unused — maps deferred       |

> v1 had a single free-text `Location`. You cannot build state or city landing pages, geo-schema, or filtered SEO indexes off a free-text string — and the client asked specifically for visibility in named U.S. states.

#### Pricing

| Field                   | Type           | Null | Notes                                                                            |
| ----------------------- | -------------- | ---- | -------------------------------------------------------------------------------- |
| `price`                 | numeric(16,2)  | yes  | Null only when `price_on_request`                                                |
| `currency_code`         | char(3)        | no   | Default `KES`                                                                    |
| `price_period`          | `price_period` | no   | Default `total`. Go-downs price `per_sqft_month`.                                |
| `price_on_request`      | boolean        | no   | Default false. For trophy assets — also removes the number a scraper most wants. |
| `service_charge`        | numeric(16,2)  | yes  | Commercial leases                                                                |
| `service_charge_period` | `price_period` | yes  |                                                                                  |

**Constraint:** `CHECK (price_on_request OR price IS NOT NULL)`

#### Filterable attributes — promoted out of JSONB

| Field             | Type          | Null |
| ----------------- | ------------- | ---- | --------------------------------- |
| `bedrooms`        | smallint      | yes  |
| `bathrooms`       | smallint      | yes  |
| `parking_spaces`  | smallint      | yes  |
| `floor_area`      | numeric(12,2) | yes  |
| `floor_area_unit` | `area_unit`   | yes  |
| `land_area`       | numeric(12,2) | yes  |
| `land_area_unit`  | `area_unit`   | yes  |
| `floors`          | smallint      | yes  |
| `year_built`      | smallint      | yes  |
| `features`        | jsonb         | no   | Default `{}` — **long tail only** |

> **Why bedrooms left the JSONB.** Bedrooms, bathrooms and area are the primary sort and filter axes on every property site. Inside `features` they cannot be indexed usefully or sorted without casting every row. The JSONB stays for the genuine long tail: borehole, backup generator, three-phase power, loading bay height.

**Constraint:** `CHECK ((floor_area IS NULL) = (floor_area_unit IS NULL))`

#### Ownership and merchandising

| Field          | Type              | Null | Notes                                    |
| -------------- | ----------------- | ---- | ---------------------------------------- |
| `agent_id`     | uuid FK → `users` | no   |                                          |
| `created_by`   | uuid FK → `users` | yes  |                                          |
| `is_exclusive` | boolean           | no   | Default false. The client's actual moat. |
| `is_featured`  | boolean           | no   | Default false                            |
| `view_count`   | integer           | no   | Default 0                                |

#### SEO

| Field              | Type         | Null | Notes                                                                                |
| ------------------ | ------------ | ---- | ------------------------------------------------------------------------------------ |
| `meta_title`       | varchar(70)  | yes  |                                                                                      |
| `meta_description` | varchar(180) | yes  |                                                                                      |
| `og_image_url`     | text         | yes  |                                                                                      |
| `canonical_url`    | text         | yes  | Wins the duplicate-content fight against scrapers                                    |
| `noindex`          | boolean      | no   | Default false                                                                        |
| `search_vector`    | tsvector     | —    | **Generated column**, weighted A/B/C over title, location, description. GIN indexed. |

#### Lifecycle

| Field                                      | Type        | Null |
| ------------------------------------------ | ----------- | ---- |
| `published_at`                             | timestamptz | yes  |
| `sold_at`                                  | timestamptz | yes  |
| `created_at` / `updated_at` / `deleted_at` | timestamptz |      |

> `updated_at` is also the sitemap `lastmod`. Google uses it for crawl prioritisation. v1 had neither `updated_at` nor `deleted_at` on the most important entity in the system.

**Indexes:** unique `(slug) WHERE deleted_at IS NULL` · unique `(reference_code)` · `(published_at DESC) WHERE status='published' AND deleted_at IS NULL` · `(property_type, purpose, status)` · `(country_code, state_region, city)` · `(currency_code, price) WHERE published` · `(bedrooms, bathrooms)` · `(agent_id)` · GIN `(search_vector)` · GIN `(features)`

> **Why `draft` and `pending_review` exist.** This is the quality gate the client asked for. One designated poster writes; the admin approves; nothing reaches the public site unreviewed. It delivers his stated requirement for roughly 2% of what a full permissions system costs.

---

### ListingMedia `[A]` `FIXED`

Photos first. The client named quality photography as the single biggest driver of his business, ahead of everything else on the site.

| Field                       | Type                 | Null | Notes                                                                                                         |
| --------------------------- | -------------------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| `listing_id`                | uuid FK → `listings` | no   | Cascade delete                                                                                                |
| `type`                      | `media_type`         | no   | Default `image`. **v1 read "video or audio".**                                                                |
| `url`                       | text                 | no   |                                                                                                               |
| `thumbnail_url`             | text                 | yes  |                                                                                                               |
| `watermarked_url`           | text                 | yes  | Anti-scrape — serve this publicly                                                                             |
| `provider`                  | varchar(40)          | no   | Default `cloudinary`                                                                                          |
| `provider_public_id`        | text                 | yes  | **Required to delete or transform later.** Storing only the URL makes every asset permanent and unmodifiable. |
| `alt_text`                  | varchar(180)         | yes  | Image SEO + accessibility                                                                                     |
| `caption`                   | varchar(200)         | yes  |                                                                                                               |
| `width` / `height`          | integer              | yes  | Reserve space — protects Core Web Vitals, which feed ranking                                                  |
| `bytes`                     | bigint               | yes  |                                                                                                               |
| `duration_seconds`          | integer              | yes  | Video only                                                                                                    |
| `is_primary`                | boolean              | no   | Default false. **Unique per listing.**                                                                        |
| `sort_order`                | integer              | no   | Default 0                                                                                                     |
| `created_at` / `deleted_at` | timestamptz          |      |                                                                                                               |

**Indexes:** unique `(listing_id) WHERE is_primary AND deleted_at IS NULL` · `(listing_id, sort_order) WHERE deleted_at IS NULL`

> Without `sort_order` the agent cannot choose which photograph leads the card — and on a site whose entire brief is "premium, not basic," that control _is_ the product.

---

## Cluster C — Demand

> ### ⚠️ Why v1's Booking model would have failed silently
>
> v1's `Booking` required a `User Id` **and** a `Listing Id`. The form the client described has neither: an anonymous visitor, arriving from search, describing a property that is **not currently listed**, asking for a callback. Under v1 that visitor would have been asked to register — and left. The site's entire commercial purpose would have failed with no error and no record.

### Lead `[A]` `NEW — highest priority in this document`

One enquiry from one person. Created by the contact form, the listing enquiry button, the valuation form and the viewing form alike. **No account required, ever.**

#### Who

| Field             | Type         | Null | Notes                                         |
| ----------------- | ------------ | ---- | --------------------------------------------- |
| `full_name`       | varchar(150) | no   |                                               |
| `email`           | citext       | yes  |                                               |
| `phone`           | varchar(32)  | no   | The client asked for phone capture explicitly |
| `whatsapp_number` | varchar(32)  | yes  |                                               |
| `country_code`    | char(2)      | yes  | Diaspora buyers: `US`, `GB`, `AE`             |
| `state_region`    | varchar(100) | yes  |                                               |
| `city`            | varchar(100) | yes  |                                               |

**Constraint:** `CHECK (email IS NOT NULL OR phone IS NOT NULL)`

#### What they want

| Field                       | Type                 | Null | Notes                                             |
| --------------------------- | -------------------- | ---- | ------------------------------------------------- |
| `intent`                    | `lead_intent`        | no   | Default `general`                                 |
| `property_type`             | `property_type`      | yes  |                                                   |
| `property_subtype`          | `property_subtype`   | yes  |                                                   |
| `preferred_location`        | varchar(200)         | yes  |                                                   |
| `budget_min` / `budget_max` | numeric(16,2)        | yes  |                                                   |
| `currency_code`             | char(3)              | no   | Default `KES`                                     |
| `requirements`              | text                 | yes  | Free text from the form                           |
| `listing_id`                | uuid FK → `listings` | yes  | **Null = no match yet.** This is the common case. |
| `user_id`                   | uuid FK → `users`    | yes  | Rarely set                                        |

#### Attribution — how you prove the SEO spend worked

| Field          | Type          | Null |
| -------------- | ------------- | ---- |
| `source`       | `lead_source` | no   |
| `source_page`  | text          | yes  |
| `referrer`     | text          | yes  |
| `utm_source`   | varchar(120)  | yes  |
| `utm_medium`   | varchar(120)  | yes  |
| `utm_campaign` | varchar(120)  | yes  |
| `utm_term`     | varchar(120)  | yes  |
| `utm_content`  | varchar(120)  | yes  |

> **The three fields that carry the account.** In month three the client will ask whether the SEO work produced anything. `utm_source` / `utm_medium` / `utm_campaign` are the difference between showing him a funnel and arguing from memory.

#### Pipeline

| Field                                      | Type              | Null | Notes                |
| ------------------------------------------ | ----------------- | ---- | -------------------- |
| `status`                                   | `lead_status`     | no   | Default `new`        |
| `assigned_agent_id`                        | uuid FK → `users` | yes  |                      |
| `first_contacted_at`                       | timestamptz       | yes  | Response-time metric |
| `lost_reason`                              | varchar(200)      | yes  |                      |
| `ip_address`                               | inet              | yes  |                      |
| `user_agent`                               | text              | yes  |                      |
| `consent_marketing`                        | boolean           | no   | Default false        |
| `created_at` / `updated_at` / `deleted_at` | timestamptz       |      |                      |

> `consent_marketing` is not decoration. Kenya's Data Protection Act 2019 and, for the North American audience the client is targeting, CAN-SPAM both make a recorded consent flag the cheapest available insurance. One boolean now, versus a policy problem later.

**Indexes:** `(status, created_at DESC) WHERE deleted_at IS NULL` · `(assigned_agent_id, status)` · `(listing_id)` · `(utm_source, utm_campaign, created_at DESC)` · `(phone)`

---

### ViewingRequest `[A]` `NEW — split from Booking`

A named person wants to see a specific listing on a specific day. The agent confirms the actual time from the dashboard.

| Field                                      | Type                 | Null | Notes                             |
| ------------------------------------------ | -------------------- | ---- | --------------------------------- |
| `listing_id`                               | uuid FK → `listings` | no   |                                   |
| `lead_id`                                  | uuid FK → `leads`    | no   | Cascade delete                    |
| `preferred_date`                           | date                 | no   |                                   |
| `preferred_time_slot`                      | varchar(40)          | yes  | `morning` / `afternoon` / `14:30` |
| `alternate_date`                           | date                 | yes  |                                   |
| `confirmed_at`                             | timestamptz          | yes  | **Set on the admin dashboard**    |
| `assigned_agent_id`                        | uuid FK → `users`    | yes  |                                   |
| `status`                                   | `request_status`     | no   | Default `pending`                 |
| `message`                                  | text                 | yes  | From the visitor                  |
| `internal_notes`                           | text                 | yes  | Never rendered publicly           |
| `cancelled_reason`                         | varchar(200)         | yes  |                                   |
| `created_at` / `updated_at` / `deleted_at` | timestamptz          |      |                                   |

**Constraint:** `CHECK (status <> 'confirmed' OR confirmed_at IS NOT NULL)`
**Indexes:** `(confirmed_at) WHERE status='confirmed' AND deleted_at IS NULL` (today's diary) · `(status, created_at DESC)` (queue)

> **The status field v1 lacked.** The meeting established the agent sets the confirmed date from the dashboard. Without a state machine there is nothing to filter the dashboard on, no way to see today's diary, and no way to tell an abandoned request from a completed one.

---

### ValuationRequest `[A]` `NEW — split from Booking`

An owner wants a property assessed and possibly listed. Different fields, different lifecycle, different admin screen — hence a different table.

#### Submitted by the owner

| Field                                     | Type                  | Null |
| ----------------------------------------- | --------------------- | ---- |
| `lead_id`                                 | uuid FK → `leads`     | no   |
| `property_type`                           | `property_type`       | no   |
| `property_subtype`                        | `property_subtype`    | yes  |
| `location_label`                          | varchar(200)          | no   |
| `country_code`                            | char(2)               | no   |
| `state_region` / `city` / `neighbourhood` | varchar               | yes  |
| `bedrooms` / `bathrooms`                  | smallint              | yes  |
| `floor_area` + `floor_area_unit`          | numeric / `area_unit` | yes  |
| `land_area` + `land_area_unit`            | numeric / `area_unit` | yes  |
| `owner_expectation`                       | numeric(16,2)         | yes  |
| `message`                                 | text                  | yes  |

#### Filled in by the agent after the site visit

| Field                | Type                 | Null | Notes                               |
| -------------------- | -------------------- | ---- | ----------------------------------- |
| `visit_scheduled_at` | timestamptz          | yes  |                                     |
| `condition`          | `property_condition` | yes  | good / average / poor               |
| `evaluation_notes`   | text                 | yes  | The report from the agent's viewing |
| `estimated_value`    | numeric(16,2)        | yes  |                                     |
| `currency_code`      | char(3)              | no   | Default `KES`                       |
| `valued_at`          | timestamptz          | yes  |                                     |
| `valued_by`          | uuid FK → `users`    | yes  |                                     |

#### Outcome

| Field                                      | Type                 | Null | Notes                                         |
| ------------------------------------------ | -------------------- | ---- | --------------------------------------------- |
| `list_out`                                 | boolean              | no   | Default false — list the property on the site |
| `converted_listing_id`                     | uuid FK → `listings` | yes  | **Closes the acquisition loop**               |
| `assigned_agent_id`                        | uuid FK → `users`    | yes  |                                               |
| `status`                                   | `request_status`     | no   | Default `pending`                             |
| `created_at` / `updated_at` / `deleted_at` | timestamptz          |      |                                               |

> `converted_listing_id` turns the valuation pipeline into a measurable acquisition funnel: requests received → visited → valued → listed. That is a number the client can act on, and it costs one nullable foreign key.

---

### LeadActivity `[B]` `NEW — the light CRM`

The whole CRM the client asked about, in one child table. He said he wants to manage everything from one point instead of Excel — this is the minimum that delivers it.

| Field         | Type              | Null | Notes                                                                |
| ------------- | ----------------- | ---- | -------------------------------------------------------------------- |
| `lead_id`     | uuid FK → `leads` | no   | Cascade delete                                                       |
| `user_id`     | uuid FK → `users` | yes  |                                                                      |
| `type`        | varchar(24)       | no   | `note` / `call` / `whatsapp` / `email` / `meeting` / `status_change` |
| `body`        | text              | yes  |                                                                      |
| `occurred_at` | timestamptz       | no   | Default now()                                                        |
| `created_at`  | timestamptz       | no   |                                                                      |

> **Scope discipline.** If the budget forces a cut, drop the activity _UI_ and keep a CSV export of `leads`. Do not build deal stages, quotas or forecasting — that is a separate product and a separate contract.

---

## Cluster D — Content & SEO

### Insight `[B — protect this one]` `REVISED`

Market commentary, area guides and investment notes. Geo-targeted so each piece can rank for a **place**, not a generic term.

| Field                                      | Type              | Null | Notes                                                  |
| ------------------------------------------ | ----------------- | ---- | ------------------------------------------------------ |
| `slug`                                     | varchar(200)      | no   | Unique where not deleted                               |
| `title`                                    | varchar(200)      | no   |                                                        |
| `summary`                                  | varchar(300)      | yes  | Short description                                      |
| `content`                                  | text              | no   |                                                        |
| `cover_image_url`                          | text              | yes  |                                                        |
| `cover_image_alt`                          | varchar(180)      | yes  |                                                        |
| `author_id`                                | uuid FK → `users` | yes  | v1 left `Author` untyped                               |
| `status`                                   | `content_status`  | no   | Default `draft`                                        |
| `target_country_code`                      | char(2)           | yes  | **The SEO mechanism, not metadata**                    |
| `target_state_region`                      | varchar(100)      | yes  |                                                        |
| `target_city`                              | varchar(100)      | yes  |                                                        |
| `meta_title`                               | varchar(70)       | yes  |                                                        |
| `meta_description`                         | varchar(180)      | yes  |                                                        |
| `canonical_url`                            | text              | yes  |                                                        |
| `og_image_url`                             | text              | yes  |                                                        |
| `noindex`                                  | boolean           | no   | Default false                                          |
| `word_count`                               | integer           | no   | Default 0                                              |
| `read_minutes`                             | integer           | —    | **Generated:** `GREATEST(1, CEIL(word_count / 200.0))` |
| `view_count`                               | integer           | no   | Default 0                                              |
| `published_at`                             | timestamptz       | yes  |                                                        |
| `created_at` / `updated_at` / `deleted_at` | timestamptz       |      |                                                        |

> **Read time is derived, not stored.** v1 stored it as an editable field, which guarantees it drifts from the article the first time anyone edits it.

> **Do not cut Insights.** Geo-targeted market commentary is the only realistic route to the U.S.-state visibility the client asked for. Competing for generic terms against portals with fifteen years of domain authority will not work; competing for "warehouse space Mombasa Road lease rates" will.

---

### InsightListing `[B]` `NEW`

Many-to-many. One market report references several listings — v1 had a single FK.

| Field        | Type                 | Notes                         |
| ------------ | -------------------- | ----------------------------- |
| `insight_id` | uuid FK → `insights` | Composite PK. Cascade delete. |
| `listing_id` | uuid FK → `listings` | Composite PK. Cascade delete. |
| `sort_order` | integer              | Default 0                     |

### Tag `[B]` `NEW`

| Field  | Type        | Notes  |
| ------ | ----------- | ------ |
| `name` | varchar(80) |        |
| `slug` | varchar(90) | Unique |

### InsightTag `[B]` `NEW`

| Field        | Type                                |
| ------------ | ----------------------------------- |
| `insight_id` | uuid FK → `insights` (composite PK) |
| `tag_id`     | uuid FK → `tags` (composite PK)     |

---

### Service `[B]` `NEW`

Backs the Services page, which v1 listed as a required page without giving it any data.

| Field                                      | Type         | Null |
| ------------------------------------------ | ------------ | ---- |
| `slug`                                     | varchar(120) | no   |
| `title`                                    | varchar(150) | no   |
| `summary`                                  | varchar(300) | yes  |
| `description`                              | text         | yes  |
| `icon`                                     | varchar(60)  | yes  |
| `image_url`                                | text         | yes  |
| `meta_title`                               | varchar(70)  | yes  |
| `meta_description`                         | varchar(180) | yes  |
| `sort_order`                               | integer      | no   |
| `is_active`                                | boolean      | no   |
| `created_at` / `updated_at` / `deleted_at` | timestamptz  |      |

---

## Cluster E — Operations

### Currency `[A]` `NEW`

| Field            | Type        | Notes                                              |
| ---------------- | ----------- | -------------------------------------------------- |
| `code`           | char(3)     | **Primary key.** `KES`, `USD`, `GBP`, `EUR`, `AED` |
| `symbol`         | varchar(8)  |                                                    |
| `name`           | varchar(60) |                                                    |
| `decimal_places` | smallint    | Default 2                                          |
| `is_active`      | boolean     | Default true                                       |
| `sort_order`     | integer     | Default 0                                          |

### ExchangeRate `[A]` `NEW`

Currency conversion was confirmed in the meeting and modelled nowhere in v1.

| Field             | Type                      | Null | Notes                           |
| ----------------- | ------------------------- | ---- | ------------------------------- |
| `base_currency`   | char(3) FK → `currencies` | no   |                                 |
| `target_currency` | char(3) FK → `currencies` | no   |                                 |
| `rate`            | numeric(18,8)             | no   |                                 |
| `source`          | varchar(40)               | no   | Provider name, for auditability |
| `rate_date`       | date                      | no   |                                 |
| `fetched_at`      | timestamptz               | no   |                                 |

**Constraint:** unique `(base_currency, target_currency, rate_date)`

> **Rule:** prices are always **stored** in the listing's own currency and **displayed** converted. Never write a converted figure back to `listings.price`. Cache rates daily — never call an FX API during a page render. The `rate_date` unique key means a failed daily job degrades to yesterday's rate rather than to no price at all.

---

### NotificationLog `[A]` `NEW`

Every lead alert sent to an agent, with its delivery outcome. `id` is `BIGSERIAL`, not UUID.

| Field                 | Type                  | Null | Notes                          |
| --------------------- | --------------------- | ---- | ------------------------------ |
| `channel`             | varchar(16)           | no   | `email` / `whatsapp` / `sms`   |
| `template`            | varchar(60)           | no   |                                |
| `recipient`           | varchar(160)          | no   |                                |
| `related_type`        | varchar(40)           | yes  | `lead` / `viewing_request` / … |
| `related_id`          | uuid                  | yes  | Polymorphic                    |
| `status`              | `notification_status` | no   | Default `queued`               |
| `provider_message_id` | text                  | yes  |                                |
| `error_message`       | text                  | yes  |                                |
| `sent_at`             | timestamptz           | yes  |                                |
| `created_at`          | timestamptz           | no   |                                |

**Indexes:** `(status, created_at DESC) WHERE status IN ('failed','bounced')` · `(related_type, related_id)`

> **Why this is Tier A.** A lead on a 200M KES property that never reaches an agent because an SMTP call quietly failed is the single most expensive bug this system can have — and without this table nobody would ever find out it happened.

---

### SiteSetting `[A]` `NEW`

| Field        | Type              | Notes                                                 |
| ------------ | ----------------- | ----------------------------------------------------- |
| `key`        | varchar(80)       | **Primary key.** `contact.whatsapp`, `seo.default_og` |
| `value`      | jsonb             |                                                       |
| `group_name` | varchar(40)       | Default `general`                                     |
| `updated_by` | uuid FK → `users` |                                                       |
| `updated_at` | timestamptz       |                                                       |

> Without this, the WhatsApp number and contact details are hardcoded and week two becomes a code deploy.

### Redirect `[A]` `NEW`

| Field         | Type         | Notes       |
| ------------- | ------------ | ----------- |
| `from_path`   | varchar(400) | Unique      |
| `to_path`     | varchar(400) |             |
| `status_code` | smallint     | Default 301 |
| `hits`        | integer      | Default 0   |
| `created_at`  | timestamptz  |             |

> **Ten minutes now.** Write a `redirects` row automatically whenever a listing or insight slug changes, in the same transaction. Without it, every corrected typo in a URL silently discards whatever ranking that page had earned.

---

### ListingView `[B]` `NEW`

The data behind the Analytics Dashboard page, which v1 listed with no backing model. `id` is `BIGSERIAL`.

| Field          | Type                 | Null | Notes                                        |
| -------------- | -------------------- | ---- | -------------------------------------------- |
| `listing_id`   | uuid FK → `listings` | no   | Cascade delete                               |
| `session_hash` | varchar(64)          | yes  | Hashed — no raw IP retained                  |
| `country_code` | char(2)              | yes  | **Proves the U.S. traffic, or disproves it** |
| `referrer`     | text                 | yes  |                                              |
| `utm_source`   | varchar(120)         | yes  |                                              |
| `device`       | varchar(20)          | yes  |                                              |
| `created_at`   | timestamptz          | no   |                                              |

> **If the dashboard is cut, keep the table.** It costs almost nothing to write and the data cannot be recovered retroactively. Ship the collector in v1 and the charts whenever budget allows.

---

### AuditLog `[B]` `NEW`

`id` is `BIGSERIAL`.

| Field         | Type              | Null | Notes                                           |
| ------------- | ----------------- | ---- | ----------------------------------------------- |
| `user_id`     | uuid FK → `users` | yes  |                                                 |
| `entity_type` | varchar(40)       | no   |                                                 |
| `entity_id`   | uuid              | no   |                                                 |
| `action`      | varchar(24)       | no   | `created` / `updated` / `deleted` / `published` |
| `changes`     | jsonb             | yes  | `{ field: [before, after] }`                    |
| `ip_address`  | inet              | yes  |                                                 |
| `user_agent`  | text              | yes  |                                                 |
| `created_at`  | timestamptz       | no   |                                                 |

> The client's entire brief is control and quality. "Who changed the price on that 200M listing?" needs an answer.

---

## 5. Relationship Summary

```
IDENTITY
users ──1:1── agent_profiles
  ├──< auth_sessions
  └──< password_reset_tokens

INVENTORY (supply)
users ──< listings ──< listing_media
                 └──< listing_views

DEMAND (the hinge — every public form lands here)
leads ──< viewing_requests    >── listings
  ├──< valuation_requests  ┄>  listings   (converted_listing_id)
  ├──< lead_activities      >── users
  └──> users                              (assigned_agent_id)

CONTENT & SEO
insights >──< listings   (via insight_listings)
insights >──< tags       (via insight_tags)
services                 (standalone)

OPERATIONS
currencies ──< exchange_rates
site_settings   redirects
notification_logs ┄> leads · viewing_requests   (polymorphic)
audit_logs        ┄> any entity                 (polymorphic)

──<  one-to-many     ┄>  nullable / polymorphic     >──<  many-to-many
```

---

## 6. Migration Order

Dependency-ordered. Each step is safe only after the one above it.

1. Extensions (`citext`, `pg_trgm`, `pgcrypto`) + shared `touch_updated_at()` trigger function
2. All `CREATE TYPE` enums — everything below depends on these
3. `users` → `auth_sessions` → `password_reset_tokens`
4. `agent_profiles` _(FK → users)_
5. `currencies` → `exchange_rates` _(seed KES, USD, GBP, EUR, AED)_
6. `listings` _(FK → users)_ → `listing_media`
7. `leads` _(FK → listings, users)_
8. `viewing_requests` → `valuation_requests` _(FK → leads, listings)_
9. `site_settings` → `redirects` → `notification_logs` — no dependencies, any time after step 3
10. **[B]** `insights` → `tags` → `insight_listings` → `insight_tags` → `services`
11. **[B]** `lead_activities` → `listing_views` → `audit_logs`
12. Seed: one admin user, three agent profiles, currency rows, site settings defaults

### Two things to get right in step 6

- **Reference codes** — generate as `FC-{TYPE}-{seq:6}` from a dedicated sequence, **not** from a row count. Deleted listings must never cause a collision.
- **Slugs** — generate from title + neighbourhood + short suffix, and **never regenerate on edit**. When a slug must change, write a `redirects` row in the same transaction.

---

## 7. Phase 2 — Specified, Not Built

Designed now so v1 doesn't paint the build into a corner, and priced separately in the proposal so the client sees a roadmap rather than a limitation.

| Deferred                                                 | Trigger to build it                                                                              |   Est. |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -----: |
| `roles`, `permissions`, `role_permissions`, `user_roles` | More than ~8 users, or the first time an agent needs edit-but-not-publish                        |  3.0 d |
| `favorites`                                              | Only worthwhile alongside buyer accounts, which the client hasn't asked for                      |  1.0 d |
| `comments`                                               | **Recommend never on listings.** If wanted on insights, needs a moderation queue and `parent_id` |  2.0 d |
| `saved_searches` + alerts                                | Genuinely valuable for diaspora buyers watching a segment. Strong candidate.                     |  2.5 d |
| `chatbot_conversations`, `chatbot_messages`              | Client called it "an addition." Needs transcripts and a handoff-to-human path.                   |  3.0 d |
| Map integration                                          | Explicitly deferred by the client until exclusive mandates. Lat/long already in place.           |  1.5 d |
| Payments                                                 | Only if the client diversifies into property management, as he indicated he might                | 5.0 d+ |

### RBAC migration path — non-destructive

The `users.role` enum is **not a dead end**. When the trigger arrives:

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(200),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL UNIQUE,   -- 'listing.publish'
  group_name VARCHAR(40) NOT NULL,    -- 'listing'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- the join tables v1 was missing
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- backfill: every existing user keeps exactly the access they had
INSERT INTO roles (name, is_system)
SELECT DISTINCT role::text, TRUE FROM users;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = u.role::text;
```

The enum column stays as a cached primary role.

---

## 8. Confirm Before You Migrate

Seven questions, roughly seven hours total. Each can invalidate part of this document, and all are cheaper to answer now than after the first migration runs.

| Ask            | Question                                                                                                                                                                                                                              |   Cost |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| Dennis         | **Should someone have to create an account to send an enquiry? The answer must be no.** Confirm it, then confirm the exact form fields.                                                                                               | 15 min |
| Dennis         | Send ten real listings you'd post on day one, with photos and full details. Model against these, not imagination.                                                                                                                     |   1 hr |
| Dennis         | The competitor links you offered — run them through Ahrefs/Semrush. Domain authority, top pages, which countries actually send traffic. **Most important item here.**                                                                 |   2 hr |
| Dennis         | What do you do today when an enquiry comes in — Excel, WhatsApp, notebook? Model `lead_activities` to that answer, or drop it.                                                                                                        | 20 min |
| Dennis         | Company name, domain, logo, and whether the licence number is real and displayable. Every timeline commitment sits downstream of these.                                                                                               | 10 min |
| Team           | Write the six hardest queries against this schema — "three-bed houses in Karen under 30M by price," "go-downs by rate per sq ft," "everything modified in 7 days for the sitemap." If any needs JSONB gymnastics, fix the schema now. |   2 hr |
| Paul & Michael | Price Tier A honestly in engineer-days at the real rate, compare to 90,500 KES, settle the gap **before** Monday's proposal.                                                                                                          |   1 hr |

### Green-light conditions

All four, before the first migration:

1. `leads` built, and enquiry requires **no account**
2. SEO fields and structured location on `listings`, `agent_profiles`, `insights`
3. RBAC, comments and favourites priced as **Phase 2 line items** in the proposal, not absorbed
4. A realistic SEO timeline written into Monday's proposal in plain language — technical SEO ships at launch, ranking movement is a 3–6 month curve, U.S.-state visibility is a content programme, not a build deliverable

---

_Prepared against the client scoping meeting of 05/09/2026 and the constraints agreed there: web only · no in-built payments · currency conversion required · maps deferred · one designated poster · one-month target · 90,000–110,000 KES._
