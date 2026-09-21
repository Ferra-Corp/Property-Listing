"use client"

import { PageIn, PanelIn } from "../../_components/Admin/motion"
import { InsightPanel } from "./_components/insight-panel"
import { InsightList } from "./_components/insight-list"
import { useInsightContext } from "../../_lib/Context/Insight"

export default function AdminInsightsPage() {
  const { insights, loading } = useInsightContext()

  const sorted = [...insights].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ),
    selected = sorted[0]

  return (
    <PageIn>
      {/* 
        Added md:gap-6 and md:p-6 to create that slight margin division. 
        This gives the layout room to breathe and frames the content beautifully.
      */}
      <div className="grid min-h-[calc(100vh-4rem)] bg-(--color-neutral-50) md:grid-cols-[minmax(0,1fr)_440px] md:gap-6 md:p-6 lg:gap-8 lg:p-8">
        {/* Left Panel Container */}
        <div className="min-w-0 overflow-hidden bg-(--color-bg) md:rounded-2xl md:border md:border-(--color-divider) md:shadow-sm">
          <InsightList selectedId={selected?.id} />
        </div>

        {/* 
          Right Panel Container (Aside)
          Removed the harsh `border-l` and replaced it with a fully contained, 
          elevated modern card look to emphasize the separation.
        */}
        <aside className="hidden overflow-hidden rounded-2xl border border-(--color-divider) bg-(--color-bg) shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] transition-all duration-300 md:block">
          {selected ? (
            <PanelIn panelKey={selected.id}>
              <InsightPanel id={selected.id} />
            </PanelIn>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-12 text-center">
              <span className="text-[13.5px] text-neutral-500 italic">
                {loading
                  ? "Loading…"
                  : "Select an article to view its details."}
              </span>
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
