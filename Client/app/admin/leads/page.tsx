"use client"

import { LeadPanel } from "./_components/lead-panel"
import { LeadQueue } from "./_components/lead-queue"
import { useLeadContext } from "../../_lib/Context/Lead"

export default function AdminLeadsPage() {
  const { leads, loading } = useLeadContext()

  const sorted = [...leads].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    selected = sorted[0]

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
      <LeadQueue selectedId={selected?.id} />
      <aside className="hidden border-l border-(--color-divider) md:block">
        {selected ? (
          <LeadPanel id={selected.id} />
        ) : (
          <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
            {loading ? "Loading…" : "No leads yet."}
          </div>
        )}
      </aside>
    </div>
  )
}
