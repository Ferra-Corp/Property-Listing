"use client"

import { use } from "react"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon, MoreIcon } from "../../../_components/Admin/icons"
import { K } from "../../../_components/Admin/ui"
import { PageIn, PanelIn } from "../../../_components/Admin/motion"
import { ValuationPanel } from "../_components/valuation-panel"
import { ValuationQueue } from "../_components/valuation-queue"

export default function AdminValuationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <PageIn>
      {/* Same xl: threshold and reasoning as /admin/valuations. */}
      <div className="grid xl:h-[calc(100dvh-178px)] xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-4 xl:p-4">
        <div className="hidden xl:block xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          <ValuationQueue selectedId={id} />
        </div>
        {/* min-w-0 — see the same comment in admin/leads/[id]/page.tsx. */}
        <aside className="min-w-0 xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
          <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 xl:hidden">
            <ButtonLink
              href="/admin/valuations"
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="Back to valuations"
            >
              <BackIcon size={16} />
            </ButtonLink>
            <K className="cl-fig min-w-0 flex-1 truncate">{id}</K>
            <ButtonLink
              href={`/admin/valuations/${id}`}
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="More"
            >
              <MoreIcon size={16} />
            </ButtonLink>
          </div>
          <PanelIn panelKey={id}>
            <ValuationPanel id={id} />
          </PanelIn>
        </aside>
      </div>
    </PageIn>
  )
}
