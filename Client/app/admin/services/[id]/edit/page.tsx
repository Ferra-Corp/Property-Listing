"use client"

import { use } from "react"
import { PageIn } from "../../../../_components/Admin/motion"
import { useServiceContext } from "../../../../_lib/Context/Service"
import { ServiceForm } from "../../_components/service-form"

export default function AdminEditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { services, loading } = useServiceContext(),
    service = services.find((s) => s.id === id)

  return (
    <PageIn>
      {service ? (
        <ServiceForm service={service} />
      ) : (
        <div className="px-4 py-10 text-center text-[13.5px] text-[var(--color-neutral-600)] md:px-7">
          {loading ? "Loading…" : "Service not found."}
        </div>
      )}
    </PageIn>
  )
}
