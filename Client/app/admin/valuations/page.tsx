"use client"

import { PageIn, PanelIn } from "../../_components/Admin/motion"
import { ValuationPanel } from "./_components/valuation-panel"
import { ValuationQueue } from "./_components/valuation-queue"
import { useValuationContext } from "../../_lib/Context/Valuation Request"

export default function AdminValuationsPage() {
  const { valuationRequests, loading } = useValuationContext()

  const sorted = [...valuationRequests].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    selected = sorted[0]

  return (
    <PageIn>
      {/* Split waits for xl: (1280px) — the fixed 430px pane plus the
          list's own desktop table (~650px min) need roughly 1150px+ to sit
          side by side without one crowding the other. Below that (a
          tablet like an iPad Mini included, at 768–1024px) this used to
          hit md: and cram the table into a column so narrow its own
          columns overflowed straight across the divider into the detail
          pane. Now it's just the list at full width until there's
          genuinely room, same as leads/page.tsx. */}
      <div className="grid xl:h-[calc(100dvh-178px)] xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-4 xl:p-4">
        <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          <ValuationQueue selectedId={selected?.id} />
        </div>
        <aside className="hidden min-w-0 xl:block xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          {selected ? (
            <PanelIn panelKey={selected.id}>
              <ValuationPanel id={selected.id} />
            </PanelIn>
          ) : (
            <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
              {loading ? "Loading…" : "No valuation requests yet."}
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
