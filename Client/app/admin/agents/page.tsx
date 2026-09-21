"use client"

import { PageIn, PanelIn } from "../../_components/Admin/motion"
import { AgentPanel } from "./_components/agent-panel"
import { StaffRegister } from "./_components/staff-register"
import { useAgentContext } from "../../_lib/Context/Agent"

export default function AdminAgentsPage() {
  const { agents, loading } = useAgentContext()

  const selected = [...agents].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  )[0]

  return (
    <PageIn>
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px] md:gap-6 md:p-6">
        <StaffRegister selectedId={selected?.slug} />
        <aside className="hidden overflow-hidden rounded-(--cl-radius-lg) border border-(--color-divider) md:block md:self-start">
          {selected ? (
            <PanelIn panelKey={selected.slug}>
              <AgentPanel slug={selected.slug} />
            </PanelIn>
          ) : (
            <div className="px-5.5 py-10 text-center text-[13.5px] text-neutral-600">
              {loading
                ? "Loading…"
                : "Select someone from the register to see their profile."}
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
