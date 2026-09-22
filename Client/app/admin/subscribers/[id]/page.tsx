"use client"

import { use } from "react"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon } from "../../../_components/Admin/icons"
import { K } from "../../../_components/Admin/ui"
import { SubscriberPanel } from "../_components/subscriber-panel"
import { SubscriberList } from "../_components/subscriber-list"

export default function AdminSubscriberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
      <div className="hidden md:block">
        <SubscriberList selectedId={id} />
      </div>

      <aside className="border-l-0 border-(--color-divider) md:border-l">
        <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 md:hidden">
          <ButtonLink
            href="/admin/subscribers"
            variant="secondary"
            size="icon"
            className="h-8.5 w-8.5 flex-none"
            aria-label="Back to subscribers"
          >
            <BackIcon size={16} />
          </ButtonLink>
          <K className="cl-fig min-w-0 flex-1 truncate">{id}</K>
        </div>
        <SubscriberPanel id={id} />
      </aside>
    </div>
  )
}
