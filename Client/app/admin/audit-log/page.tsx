"use client"

import { PageIn, PanelIn } from "../../_components/Admin/motion"
import { AuditPanel } from "./_components/audit-panel"
import { AuditList } from "./_components/audit-list"
import { useLogsContext } from "../../_lib/Context/Audit"

export default function AdminAuditLogPage() {
  const { logs, loading } = useLogsContext()

  const selected = [...logs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]

  return (
    <PageIn>
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
        <AuditList selectedId={selected ? String(selected.id) : undefined} />
        <aside className="hidden border-l border-(--color-divider) md:block">
          {selected ? (
            <PanelIn panelKey={String(selected.id)}>
              <AuditPanel logId={String(selected.id)} />
            </PanelIn>
          ) : (
            <div className="px-5.5 py-10 text-center text-[13.5px] text-neutral-600">
              {loading ? "Loading…" : "No audit rows yet."}
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
