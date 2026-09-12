# Public site — Next.js port

Design code for the public-facing pages, ported from the HTML mockups. Drop
`app/system/` into `Client/` and the routes come up as-is. **Design only** —
forms are static markup, links are plain `next/link`, data is inline
constants at the top of each page ready to be swapped for your fetches.

## Routes

| Route | Mockup | File |
| --- | --- | --- |
| `/system` | Home Page | `page.tsx` |
| `/system/listings` | Listings Index | `listings/page.tsx` |
| `/system/listings/[slug]` | Property Listing Page (idiom 1b) | `listings/[slug]/page.tsx` |
| `/system/agents` | Agents Index | `agents/page.tsx` |
| `/system/agents/[slug]` | Agent Detail | `agents/[slug]/page.tsx` |
| `/system/insights` | Insights Index | `insights/page.tsx` |
| `/system/insights/[slug]` | Insight Detail | `insights/[slug]/page.tsx` |
| `/system/services` | Services | `services/page.tsx` |
| `/system/valuation-requests` | Sell or Value | `valuation-requests/page.tsx` |
| `/system/about` | About | `about/page.tsx` |
| `/system/contact` | Contact | `contact/page.tsx` |

Route folders follow the server module names in `Server/Routes.ts`
(`listings`, `agents`, `insights`, `services`, `valuation-requests`).

## Styling

`classical.css` is imported once by `app/system/layout.tsx`. It carries:

- **Tokens** scoped to `.cl-root` (set on the layout wrapper) — the Classical
  palette with this site's overrides. Nothing leaks into the rest of the app.
- **A global class layer** (`@layer components`) for the design-system
  primitives that would be noisy as utilities: `cl-btn`, `cl-input`, `cl-seg`,
  `cl-card`, `cl-tag`, `cl-plate`, `cl-table`, `cl-pair`, `cl-snum`, `cl-chip`,
  `cl-midx`, `cl-body`, `cl-k` (mono kicker), `cl-fig` (tabular figures).

Everything else is Tailwind utilities reading `var(--color-*)`. Class names are
`cl-` prefixed so they never collide with shadcn/ui.

Type is loaded through `next/font/google` in the layout — Cormorant Garamond
(`--font-cormorant`) over Lora (`--font-lora`).

## Components

`_components/ui/` holds shadcn-shaped primitives (cva variants, `data-slot`,
`cn` from the `cn` package, `React.ComponentProps` types) styled to Classical:

- `button.tsx` — `Button` / `ButtonLink`, variants `primary | secondary | ghost | bare`
- `field.tsx` — `Input`, `Textarea`, `Select`, `Field`, `Radio`, `Segmented`
- `card.tsx`, `tag.tsx`, `filters.tsx` (`Chip`, `FilterChip`, `FilterCheck`)
- `plate.tsx` — every photograph is a matted plate; the hatched placeholder is
  the default, swap `children` for `next/image` when the real photography lands
- `section.tsx` — `SectionHead`, `IndexRow`, `Disclosure`

Site chrome: `_components/site-header.tsx`, `site-footer.tsx`,
`mobile-contact-bar.tsx`, mounted by the layout.

All components are server components; nothing needs `"use client"` until you
wire state. `Segmented` accepts `value`/`onChange` if you drive it from a
client component, and is uncontrolled otherwise.

## Responsive

The mockups were drawn at 1240px and 390px. Each page is a single responsive
tree: mobile-first, with the desktop composition at the `md:` breakpoint.
Elements that exist only in one mock (the desktop filter rail, the mobile
filter sheet, the sticky contact bar) are hidden at the other breakpoint rather
than duplicated as separate trees.

## Where to wire data

Each page opens with typed constants (`LISTINGS`, `AGENTS`, `RATES`, …). Replace
those with your fetch/route-handler calls; the JSX below them needs no changes
beyond `params.slug` lookups on the two detail pages.
