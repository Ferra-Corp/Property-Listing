"use client"

import { PageIn, PanelIn } from "../../_components/Admin/motion"
import { SubscriberList } from "./_components/subscriber-list"
import { SubscriberPanel } from "./_components/subscriber-panel"
import { useSubscriberContext } from "../../_lib/Context/Subscriber"

export default function AdminSubscribersPage() {
  const { subscribers, loading } = useSubscriberContext()

  const sorted = [...subscribers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    selected = sorted[0]

  return (
    <PageIn>
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
        <SubscriberList selectedId={selected?.id} />
        <aside className="hidden border-l border-(--color-divider) md:block">
          {selected ? (
            <PanelIn panelKey={selected.id}>
              <SubscriberPanel id={selected.id} />
            </PanelIn>
          ) : (
            <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
              {loading ? "Loading…" : "No subscribers yet."}
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
