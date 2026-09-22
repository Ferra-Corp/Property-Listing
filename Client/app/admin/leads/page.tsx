"use client"

import { LeadPanel } from "./_components/lead-panel"
import { LeadQueue } from "./_components/lead-queue"
import { useLeadContext } from "../../_lib/Context/Lead"

export default function AdminLeadsPage() {
  const { leads, loading } = useLeadContext()

  const sorted = [...leads].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    selected = sorted[0]

  return (
    // md:h-[...] is the viewport minus the header/dock chrome around <main>
    // (measured live: 178px at that breakpoint) — bounding it is what lets
    // each pane below scroll independently instead of the whole page.
    <div className="grid md:h-[calc(100dvh-178px)] md:grid-cols-[minmax(0,1fr)_430px] md:gap-4 md:p-4">
      <div className="min-w-0 md:h-full md:overflow-y-auto md:rounded-(--cl-radius-lg) md:border md:border-(--color-divider) md:bg-(--color-bg)">
        <LeadQueue selectedId={selected?.id} />
      </div>
      <aside className="hidden md:block md:h-full md:overflow-y-auto md:rounded-(--cl-radius-lg) md:border md:border-(--color-divider) md:bg-(--color-bg)">
        {selected ? (
          <LeadPanel id={selected.id} />
        ) : (
          <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
            {loading ? "Loading…" : "No leads yet."}
          </div>
        )}
      </aside>
    </div>
  )
}
