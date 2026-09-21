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
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
        <div className="hidden md:block">
          <InsightList selectedId={id} />
        </div>
        <aside className="border-l-0 border-(--color-divider) md:border-l">
          <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 md:hidden">
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
