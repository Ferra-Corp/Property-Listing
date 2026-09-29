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
      {/* Split waits for xl: (1280px) — same reasoning as leads/valuations:
          the fixed detail pane plus the list's own desktop table need
          ~1150px+ side by side. Below xl: (tablet/phone) it's the list at
          full width. Height is bounded by xl:h-[calc(100dvh-178px)] —
          viewport minus the admin header/dock chrome — so each pane
          scrolls independently instead of stretching the whole page into
          a viewport-tall column of empty ivory. No outer bg override
          either; the admin shell already sits on --color-bg. */}
      <div className="grid xl:h-[calc(100dvh-178px)] xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-4 xl:p-4">
        <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          <InsightList selectedId={selected?.id} />
        </div>
        <aside className="hidden min-w-0 xl:block xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          {selected ? (
            <PanelIn panelKey={selected.id}>
              <InsightPanel id={selected.id} />
            </PanelIn>
          ) : (
            <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
              {loading
                ? "Loading…"
                : "Select an article to view its details."}
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
