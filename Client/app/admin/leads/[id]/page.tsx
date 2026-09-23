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
    // Same xl: threshold and measured offset as /admin/leads — see the
    // comment there for why the split waits for xl: now (a tablet like an
    // iPad Mini no longer tries to cram the list's desktop table into a
    // ~400px column next to the fixed 430px detail pane).
    <div className="grid xl:h-[calc(100dvh-178px)] xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-4 xl:p-4">
      <div className="hidden xl:block xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
        <LeadQueue selectedId={id} />
      </div>

      {/* min-w-0: without it, a grid item defaults to sizing itself off its
          content's min-content width — a flex button row inside was wide
          enough on its own to force this whole pane (and the page) wider
          than the viewport, silently clipped by <main>'s overflow-x-hidden
          rather than showing a scrollbar. Same reasoning as the list
          pane's own min-w-0 in admin/leads/page.tsx. */}
      <aside className="min-w-0 xl:h-full xl:overflow-y-auto xl:rounded-(--cl-radius-lg) xl:border xl:border-(--color-divider) xl:bg-(--color-bg)">
        <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 xl:hidden">
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
