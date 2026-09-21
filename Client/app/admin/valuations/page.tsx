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
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
        <ValuationQueue selectedId={selected?.id} />
        <aside className="hidden border-l border-(--color-divider) md:block">
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
