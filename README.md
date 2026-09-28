# D&G Realtors — Property Listing Platform

A full-stack real estate platform for a commercial and residential property agency: a public marketing/listings site plus a permissioned admin panel for managing inventory, enquiries, content and day-to-day operations.

> **A note on this document.** Earlier versions of this README were a pre-build DTO specification — the planning document written before any code existed, covering schema design, budget and scoping decisions from the original client meeting. That document is preserved in git history. This version instead documents the system **as it is actually built and running today**, as the base for proper product/SaaS documentation.

---

## 1. What this is

Two independent applications sharing one PostgreSQL database:

- **Client** (`Client/`) — a Next.js 16 app (App Router, Turbopack, React 19, TypeScript, Tailwind v4) serving both the **public site** and the **admin panel** from one codebase, plus acting as a thin backend-for-frontend proxy.
- **Server** (`Server/`) — a Node.js API with no framework (a hand-rolled router over the built-in `http` module), owning all business logic and the only thing that ever talks to Postgres or Redis directly.

The Client never queries the database itself. Every read/write goes: browser → Next.js Route Handler (`/admin/api/*` or `/system/api/v1/*`) → Server's REST-ish API (`/api/*`) → Postgres/Redis. This keeps auth cookies, secrets and SQL entirely server-side.

---

## 2. Tech stack

| Layer          | Choice                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Frontend       | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion (`motion`) |
| Backend        | Node.js, TypeScript (run via `tsx`), no HTTP framework                  |
| Database       | PostgreSQL 14+                                                          |
| Cache          | Redis (used selectively — see [§6](#6-caching-policy))                 |
| Media storage  | Cloudinary (images, video, watermarking)                                |
| Transactional email | Resend                                                             |
| Exchange rates | [open.er-api.com](https://open.er-api.com) — free, keyless, refreshed automatically |
| Auth           | JWT access + refresh tokens in `httpOnly` cookies, rotated transparently |

---

## 3. Features

### Public site (`Client/app/system/*`)

- Home, listings index (search, filter, sort) and listing detail pages
- Agents index and per-agent profile pages
- About, Services, Contact
- **Book a viewing** and **request a valuation** — both work with no account or sign-up, by design
- Insights: geo-targeted market commentary and area guides (the primary SEO play — ranking for a place, not a generic term)
- Newsletter subscribe / unsubscribe
- Multi-currency price display — a visitor can switch the displayed currency; KES is the till currency every price is actually stored in, converted live for display
- Custom 404 page; automatic redirect serving for changed listing/insight URLs so SEO equity isn't lost when a slug changes

### Admin panel (`Client/app/admin/*`)

| Section | Covers |
| --- | --- |
| Dashboard | At-a-glance counts and recent activity |
| Listings | Full CRUD, Cloudinary media upload (photos, video, floor plans) |
| Leads | Inbox + status pipeline + a lightweight activity log (notes, calls, WhatsApp, meetings) — the closest thing to a CRM this system has, deliberately |
| Viewings | Viewing-request queue and confirmation diary |
| Valuations | Owner valuation requests, from submission through a site-visit estimate to an optional listing conversion |
| Staff / Agents | Agent profiles (public-facing) and user accounts |
| Insights | CMS for market commentary — draft → published → archived |
| Services | The service offerings shown publicly |
| Subscribers | Newsletter list |
| Analytics | KPIs, lead funnel, traffic sources, city breakdown, and a printable analytics summary export |
| Site settings | Contact details, lead SLA, unclaimed-enquiry routing — editable without a deploy |
| Currency & rates | Pick up to 5 currencies for the public switcher (KES mandatory, up to 4 others); exchange rates refresh automatically once a day, or on demand, from the primary source, with manual override always available |
| Audit log | Who changed what, when |

Every admin section is gated by role, both in the UI (what's shown) and on the server (what's actually allowed — the UI check is a convenience, never the enforcement).

### Roles

| Role | Scope |
| --- | --- |
| `admin` | Everything, including site settings, currencies and the audit log |
| `agent` | Full control of their own listings, leads, viewings and valuations |
| `editor` | Insights, services and tags (content), plus subscriber management |
| `viewer` | Read-only across listings, leads, viewings and valuations |

Authentication supports invite-based account creation, password reset, and TOTP two-factor for accounts that can publish.

---

## 4. Getting started

### Prerequisites

- Node.js 22+
- PostgreSQL 14+
- Redis
- A Cloudinary account (media storage)
- A Resend account (transactional email — optional for local dev, required for lead-alert emails and invites to actually send)

### Environment variables

**`Server/Configurations/.env`**

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
PORT=4000
REDIRECT_LINK=http://localhost:3000    # the Client's own public URL — must be https:// in production; it decides whether auth cookies get the Secure flag
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_KEY=
RESEND_LISTING_ALERT_TEMPLATE_ID=
RESEND_SUBSCRIBERS_SEGMENT_ID=
```

**`Client/.env.local`** (project root — i.e. `Client/.env.local`, *not* `Client/app/.env.local`; Next.js only reads env files from the project root)

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Install, migrate, seed, run

```bash
# Server
cd Server
npm install
npm run migrations     # creates every table, then bootstraps one admin account (see Migrations/Seed.ts)
npm run seed:demo       # optional — demo agents, listings, insights, services, currencies & rates
npm run dev              # starts the API on PORT (default 4000)

# Client, in a second terminal
cd Client
npm install
npm run dev              # starts Next.js on :3000
```

The admin panel is at `/admin`. The credentials `Seed.ts` creates are for local development only — **rotate them before any real deployment**; see [§7](#7-before-deploying).

---

## 5. Project structure

```
Property-Listing/
├── Client/                       Next.js app — public site + admin panel + BFF proxy
│   ├── app/
│   │   ├── system/               Public site pages + its API proxy routes
│   │   ├── admin/                Admin panel pages + its API proxy routes
│   │   └── _components, _lib/    Shared UI, contexts, types, formatting helpers
│   └── proxy.ts                  Next.js middleware — admin session guard + redirect resolution
│
└── Server/                       Node API — the only thing that touches Postgres/Redis
    ├── Source/
    │   ├── Modules/               One folder per domain (Identity, Inventory, Demand, Content & SEO, Operations)
    │   │   └── <Module>/          *.types.ts · *.repository.ts · *.service.ts · *.controller.ts
    │   ├── Middleware/            Auth guard, request context
    │   └── Utilities/             Logger, HTTP helpers, mail, the exchange-rate scheduler
    ├── Configurations/            DB pool, Redis client, cache keys, env loading
    ├── Migrations/                Numbered SQL table files, the migration runner, and the two seed scripts
    └── Router.ts                  Maps every route to its controller
```

Each backend module follows the same shape: a `*.types.ts` defining the shape and the repository/service interfaces, a `*.repository.ts` doing the actual SQL, a `*.service.ts` holding validation and business rules, and a `*.controller.ts` wiring HTTP methods to service calls plus permission checks and audit logging.

---

## 6. Caching policy

Redis caches read-heavy, low-consistency-risk resources (listings, insights, and similar) with a cache-aside pattern and a 5-minute TTL, invalidated on write.

**Currencies and exchange rates are deliberately *not* cached.** Both are small tables, changed rarely, but need to be immediately and reliably consistent — a stale cached value here isn't a minor delay, it's a wrong price shown as fact. An earlier version cached them and hit a real invalidate/refetch race under quick successive edits; the fix was to stop caching these two resources rather than engineer around the race.

Exchange rates refresh automatically once every 24 hours (skipped if the data on file is already under ~20 hours old, so a dev server restarting on every file save doesn't spam the provider), with a manual "Refresh from source" action always available in the admin panel, and a staleness warning if a scheduled refresh is ever missed.

---

## 7. Before deploying

Carried over from an internal production-readiness review — treat these as blockers, not nice-to-haves:

1. **Rotate the admin bootstrap credentials.** `Migrations/Seed.ts` currently hardcodes a literal email/password committed to the repo. Anyone with repo access has that login the moment it's run against a real database — move it to environment variables before seeding production.
2. **Set `REDIRECT_LINK` to the real production `https://` URL** before deploying. It's what decides whether session cookies get the `Secure` flag.
3. **Add a `start` script for the Server** — it currently only has a `dev` script (`tsx --watch`), fine for local work but not meant for production use as-is.
4. No automated tests exist yet (`npm test` is a stub) and there's no CAPTCHA/rate-limiting on the public lead/viewing/valuation forms — both are reasonable to prioritise once traffic exists — not blockers, since it is not a viable revenue business at the moment.
5. Next.js's build fetches Google Fonts at build time (`next/font/google`) — this needs outbound internet access during CI/deploy; if that's ever restricted, switch to self-hosted font files.

---

_Prepared as a working reference for the platform as built — see git history for the original pre-build DTO specification and client scoping notes._
