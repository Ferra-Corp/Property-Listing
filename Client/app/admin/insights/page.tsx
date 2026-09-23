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
      {/* The split waits for xl: (1280px) — same reasoning as
          admin/leads/page.tsx: a fixed ~440px detail pane plus this list's
          own desktop table need real room, which a tablet (iPad Mini
          included) never has at md: (768px). Below xl: it's just the list
          at full width. Padding/gap escalation shifted from md:/lg: to
          xl:/2xl: to match — no point adding breathing room around a
          split that isn't happening yet. */}
      <div className="grid min-h-[calc(100vh-4rem)] bg-(--color-neutral-50) xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-6 xl:p-6 2xl:gap-8 2xl:p-8">
        {/* Left Panel Container */}
        <div className="min-w-0 overflow-hidden bg-(--color-bg) xl:rounded-2xl xl:border xl:border-(--color-divider) xl:shadow-sm">
          <InsightList selectedId={selected?.id} />
        </div>

        {/*
          Right Panel Container (Aside)
          Removed the harsh `border-l` and replaced it with a fully contained,
          elevated modern card look to emphasize the separation.
        */}
        <aside className="hidden min-w-0 overflow-hidden rounded-2xl border border-(--color-divider) bg-(--color-bg) shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] transition-all duration-300 xl:block">
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
