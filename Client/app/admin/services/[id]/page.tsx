"use client"

import { use } from "react"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon, MoreIcon } from "../../../_components/Admin/icons"
import { K } from "../../../_components/Admin/ui"
import { PageIn, PanelIn } from "../../../_components/Admin/motion"
import { ServicePanel } from "../_components/service-panel"
import { ServiceList } from "../_components/service-list"

export default function AdminServiceRowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <PageIn>
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
        <div className="hidden md:block">
          <ServiceList selectedId={id} />
        </div>
        <aside className="border-l-0 border-(--color-divider) md:border-l">
          <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 md:hidden">
            <ButtonLink
              href="/admin/services"
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="Back to services"
            >
              <BackIcon size={16} />
            </ButtonLink>
            <K className="cl-fig min-w-0 flex-1 truncate">{id}</K>
            <ButtonLink
              href={`/admin/services/${id}`}
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="More"
            >
              <MoreIcon size={16} />
            </ButtonLink>
          </div>
          <PanelIn panelKey={id}>
            <ServicePanel id={id} />
          </PanelIn>
        </aside>
      </div>
    </PageIn>
  )
}
