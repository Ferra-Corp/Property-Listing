"use client"

import { use } from "react"
import { PageIn } from "../../../../_components/Admin/motion"
import { useInsightContext } from "../../../../_lib/Context/Insight"
import { InsightForm } from "../../_components/insight-form"

export default function AdminEditInsightPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { insights, loading } = useInsightContext(),
    insight = insights.find((i) => i.id === id)

  return (
    <PageIn>
      {insight ? (
        <InsightForm insight={insight} />
      ) : (
        <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
          {loading ? "Loading…" : "Article not found."}
        </div>
      )}
    </PageIn>
  )
}
