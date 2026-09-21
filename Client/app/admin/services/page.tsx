"use client"

import { PageIn, PanelIn } from "../../_components/Admin/motion"
import { ServicePanel } from "./_components/service-panel"
import { ServiceList } from "./_components/service-list"
import { useServiceContext } from "../../_lib/Context/Service"
import { bySortOrder } from "./_lib"

export default function AdminServicesPage() {
  const { services, loading } = useServiceContext(),
    selected = bySortOrder(services)[0]

  return (
    <PageIn>
      <div className="grid md:grid-cols-[minmax(0,1fr)_430px]">
        <ServiceList selectedId={selected?.id} />
        <aside className="hidden border-l border-(--color-divider) md:block">
          {selected ? (
            <PanelIn panelKey={selected.id}>
              <ServicePanel id={selected.id} />
            </PanelIn>
          ) : (
            <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
              {loading ? "Loading…" : "No services yet."}
            </div>
          )}
        </aside>
      </div>
    </PageIn>
  )
}
