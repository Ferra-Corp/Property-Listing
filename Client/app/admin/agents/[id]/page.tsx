"use client"

import { use } from "react"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon, MoreIcon } from "../../../_components/Admin/icons"
import { K } from "../../../_components/Admin/ui"
import { PageIn, PanelIn } from "../../../_components/Admin/motion"
import { AgentPanel } from "../_components/agent-panel"
import { StaffPanel } from "../_components/staff-panel"
import { StaffRegister } from "../_components/staff-register"
import { useAgentContext } from "../../../_lib/Context/Agent"

export default function AdminAgentRowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { agents, loading } = useAgentContext(),
    // The row identifier is an agent's slug when they have a profile, or
    // their raw user id otherwise — see StaffRegister. Which one it is
    // isn't trustworthy until the agent list has actually loaded.
    isAgent = agents.some((a) => a.slug === id)

  return (
    <PageIn>
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px] md:gap-6 md:p-6">
        <div className="hidden md:block">
          <StaffRegister selectedId={id} />
        </div>
        <aside className="md:self-start md:overflow-hidden md:rounded-(--cl-radius-lg) md:border md:border-(--color-divider)">
          <div className="flex items-center gap-3 border-b border-(--color-divider) bg-(--color-bg) px-4 py-3.5 md:hidden">
            <ButtonLink
              href="/admin/agents"
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="Back to staff"
            >
              <BackIcon size={16} />
            </ButtonLink>
            <K className="cl-fig">{id}</K>
            <span className="flex-1" />
            <ButtonLink
              href={`/admin/agents/${id}`}
              variant="secondary"
              size="icon"
              className="h-8.5 w-8.5 flex-none"
              aria-label="More"
            >
              <MoreIcon size={16} />
            </ButtonLink>
          </div>
          <PanelIn panelKey={id}>
            {loading ? (
              <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
                Loading…
              </div>
            ) : isAgent ? (
              <AgentPanel slug={id} />
            ) : (
              <StaffPanel id={id} />
            )}
          </PanelIn>
        </aside>
      </div>
    </PageIn>
  )
}
