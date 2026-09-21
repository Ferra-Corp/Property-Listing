# Admin — Next.js port

The staff desk, ported from the `Admin *` mockups. **Design only** — no data
layer; lists are const arrays in `_data` files and every button is a
`next/link` so the flow can be clicked through.

Same conventions as `app/auth/`: server components, Tailwind arbitrary values
over the `cl-*` classes in `app/system/classical.css`, and the shared UI
primitives in `app/system/_components/ui/`.

## Layout

`layout.tsx` mounts `AdminShell` — the dark colophon rail on desktop, a header
bar plus five-door tab bar on a phone. Every page renders inside the ivory
sheet on the right.

## Routes

| Route | Mockup | File |
| --- | --- | --- |
| `/admin` | — | `page.tsx` (redirects to listings) |
| `/admin/listings` | 12a, 12b | `listings/page.tsx` |
| `/admin/listings/[ref]` | 12b, editing sheet | `listings/[ref]/page.tsx` |
| `/admin/leads` | 13a, 13b | `leads/page.tsx` |
| `/admin/leads/[id]` | 13a reading pane | `leads/[id]/page.tsx` |
| `/admin/viewings` | 14a | `viewings/page.tsx` |
| `/admin/viewings/[id]` | 14b, opened request | `viewings/[id]/page.tsx` |
| `/admin/valuations` | 15a, 15b | `valuations/page.tsx` |
| `/admin/valuations/[id]` | 15a working sheet | `valuations/[id]/page.tsx` |
| `/admin/agents` | 16a, 16b | `agents/page.tsx` |
| `/admin/agents/[id]` | 16a agent record | `agents/[id]/page.tsx` |
| `/admin/insights` | 17a, 17b | `insights/page.tsx` |
| `/admin/insights/[id]` | 17a article record | `insights/[id]/page.tsx` |
| `/admin/services` | 18a, 18b | `services/page.tsx` |
| `/admin/services/[id]` | 18a service record | `services/[id]/page.tsx` |
| `/admin/analytics` | 22a, 22b | `analytics/page.tsx` |
| `/admin/site-settings` | 19a, 19b | `site-settings/page.tsx` |
| `/admin/audit-log` | 20a, 20b | `audit-log/page.tsx` |
| `/admin/audit-log/[id]` | 20a row detail | `audit-log/[id]/page.tsx` |
| `/admin/my-profile` | 21a, 21b | `my-profile/page.tsx` |

All nine mockup pages are now ported. The staff sign-in screens are already
ported under `app/auth/`.

`_components/motion.tsx` (client) adds the desk's `motion`-powered touches:
`PageIn` (page/tab fade-up), `RowIn` (staggered row entrance + hover lift),
`PanelIn` (the floating drawer's slide-in), and a `ToastProvider` /
`ToastButton` pair used on save/confirm actions that have no backend yet.
`AdminLayout` mounts the `ToastProvider` once, above `AdminShell`.

## Components

`_components/admin-shell.tsx` (server):

- `AdminShell` — rail + sheet + tab bar.
- `PageHead` — sticky title, standing count, search field, page actions.
- `Toolbar` / `Pad` — the filter band and the body gutter.

`_components/admin-nav.tsx` (client — needs `usePathname` for the active item):

- `AdminRail`, `AdminTabs`, and the `PRIMARY`/`SECONDARY`/`TERTIARY` item lists
  that carry each door's standing figure.

`_components/ui.tsx` — the desk's small parts: `K` (kicker), `Fig`, `Status`,
`Chip`, `Banner`, `Th`/`Td`/`Tr`, `SectionHead`, `Pair`, `CheckLine`,
`ActivityLine`, `Notes`.

`_components/icons.tsx` — the Lucide glyphs, inlined at 1.6 stroke.
