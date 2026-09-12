// Listing/Agent/Insight/Service/Currency contexts now live in the root
// layout (app/layout.tsx) — the homepage at "/" needs them too, not just
// routes under /system/*. Kept as a pass-through in case this segment
// needs its own chrome later.
export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
