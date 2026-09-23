"use client"

import { use } from "react"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon, MoreIcon } from "../../../_components/Admin/icons"
import { K } from "../../../_components/Admin/ui"
import { PageIn, PanelIn } from "../../../_components/Admin/motion"
import { InsightPanel } from "../_components/insight-panel"
import { InsightList } from "../_components/insight-list"

export default function AdminInsightPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <PageIn>
      {/* Same xl: threshold and reasoning as admin/insights/page.tsx — a
          tablet like an iPad Mini no longer tries to cram the list's
          desktop table into a narrow column next to the fixed 440px
          detail pane. min-w-0 on the aside: without it, a grid item sizes
          itself off its content's min-content width (a flex button row
          here is wide enough to force the whole pane past the viewport,
          silently clipped by <main>'s overflow-x-hidden) — see the same
          comment in admin/leads/[id]/page.tsx. */}
      <div className="grid xl:h-[calc(100dvh-178px)] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-4 xl:p-4">
        <div className="hidden min-w-0 xl:block xl:h-full xl:overflow-y-auto xl:rounded-2xl xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          <InsightList selectedId={id} />
        </div>
        <aside className="min-w-0 border-l-0 border-(--color-divider) xl:h-full xl:overflow-y-auto xl:rounded-2xl xl:border xl:bg-(--color-bg)">
          <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 xl:hidden">
            <ButtonLink
              href="/admin/insights"
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="Back to insights"
            >
              <BackIcon size={16} />
            </ButtonLink>
            <K className="cl-fig min-w-0 flex-1 truncate">{id}</K>
            <ButtonLink
              href={`/admin/insights/${id}`}
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="More"
            >
              <MoreIcon size={16} />
            </ButtonLink>
          </div>
          <PanelIn panelKey={id}>
            <InsightPanel id={id} />
          </PanelIn>
        </aside>
      </div>
    </PageIn>
  )
}
