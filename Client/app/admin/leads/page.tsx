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
    // The split needs both the fixed 430px pane AND the list's own desktop
    // table (~650px min) to fit side by side — call it ~1150px minimum, so
    // it waits for xl: (1280px). Below that (including a tablet like an
    // iPad Mini at 768–1024px, which used to hit this at md: and got a
    // squeezed, overflowing table crammed into a ~400px column) it's just
    // the list at full width, same as phone width already was.
    //
    // xl:h-[...] is the viewport minus the header/dock chrome around <main>
    // (measured live: 178px at that breakpoint) — bounding it is what lets
    // each pane below scroll independently instead of the whole page.
    <div className="grid xl:h-[calc(100dvh-178px)] xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-4 xl:p-4">
      <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
        <LeadQueue selectedId={selected?.id} />
      </div>
      <aside className="hidden min-w-0 xl:block xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
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
