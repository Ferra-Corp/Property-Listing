"use client"

import { use } from "react"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon, MoreIcon } from "../../../_components/Admin/icons"
import { K } from "../../../_components/Admin/ui"
import { LeadPanel } from "../_components/lead-panel"
import { LeadQueue } from "../_components/lead-queue"

export default function AdminLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    // Same measured md:h-[...] offset as /admin/leads, so both routes'
    // panes line up and scroll independently the same way.
    <div className="grid md:h-[calc(100dvh-178px)] md:grid-cols-[minmax(0,1fr)_430px] md:gap-4 md:p-4">
      <div className="hidden md:block md:h-full md:overflow-y-auto md:rounded-(--cl-radius-lg) md:border md:border-(--color-divider) md:bg-(--color-bg)">
        <LeadQueue selectedId={id} />
      </div>

      <aside className="md:h-full md:overflow-y-auto md:rounded-(--cl-radius-lg) md:border md:border-(--color-divider) md:bg-(--color-bg)">
        <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 md:hidden">
          <ButtonLink
            href="/admin/leads"
            variant="secondary"
            size="icon"
            className="h-8.5 w-8.5 flex-none"
            aria-label="Back to leads"
          >
            <BackIcon size={16} />
          </ButtonLink>
          <K className="cl-fig min-w-0 flex-1 truncate">{id}</K>
          <ButtonLink
            href={`/admin/leads/${id}`}
            variant="secondary"
            size="icon"
            className="h-8.5 w-8.5 flex-none"
            aria-label="More"
          >
            <MoreIcon size={16} />
          </ButtonLink>
        </div>
        <LeadPanel id={id} />
      </aside>
    </div>
  )
}
