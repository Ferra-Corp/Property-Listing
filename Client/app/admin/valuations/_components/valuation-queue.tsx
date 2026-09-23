"use client"

import * as React from "react"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn, useToast } from "../../../_components/Admin/motion"
import { useValuationContext } from "../../../_lib/Context/Valuation Request"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { usePermission } from "../../../_lib/permissions"
import type { RequestStatus } from "../../../_lib/Types/Valuation Request"
import { STATUS_LABEL, STATUS_TONE, waitingLabel } from "../_lib"
import { titleCase } from "../../listings/_lib"

const TABS = ["Pending", "Scheduled", "Completed", "All"] as const

export function ValuationQueue({ selectedId }: { selectedId?: string }) {
  const { valuationRequests, editValuationRequest, loading } =
      useValuationContext(),
    { leads } = useLeadContext(),
    { agents } = useAgentContext(),
    canEdit = usePermission("Edit valuation request"),
    push = useToast(),
    [tab, setTab] = React.useState<(typeof TABS)[number]>("Pending"),
    [agentFilter, setAgentFilter] = React.useState(""),
    [sort, setSort] = React.useState<"waiting" | "newest" | "value">("waiting"),
    [selected, setSelected] = React.useState<Set<string>>(new Set())

  const leadFor = (leadId: string) => leads.find((l) => l.id === leadId),
    agentName = (userId: string | null) =>
      userId
        ? (agents.find((a) => a.user_id === userId)?.display_name ??
          "Unassigned")
        : "Unassigned"

  const filtered = valuationRequests.filter((v) => {
    if (tab === "Pending" && v.status !== "pending") return false
    if (tab === "Scheduled" && v.status !== "confirmed") return false
    if (tab === "Completed" && v.status !== "completed") return false
    if (agentFilter === "unassigned" && v.assigned_agent_id) return false
    if (
      agentFilter &&
      agentFilter !== "unassigned" &&
      v.assigned_agent_id !== agentFilter
    )
      return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === "value")
      return (b.estimated_value ?? 0) - (a.estimated_value ?? 0)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const counts = {
    pending: valuationRequests.filter((v) => v.status === "pending").length,
    scheduled: valuationRequests.filter((v) => v.status === "confirmed").length,
    completed: valuationRequests.filter((v) => v.status === "completed").length,
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkSetStatus(status: RequestStatus) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => editValuationRequest(id, { status })))
      push({
        title: `${ids.length} request${ids.length === 1 ? "" : "s"} moved to ${STATUS_LABEL[status].toLowerCase()}`,
      })
      setSelected(new Set())
    } catch (error) {
      push({
        title: "Couldn't update those requests",
        body: (error as Error).message,
      })
    }
  }

  return (
    <div className="min-w-0">
      <PageHead
        title="Valuations"
        meta={`${counts.pending} pending · ${counts.scheduled} scheduled · ${counts.completed} completed`}
      >
        <ButtonLink
          href="/admin/valuations"
          variant="secondary"
          className="hidden md:inline-flex"
        >
          Export
        </ButtonLink>
      </PageHead>

      <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-3.5 md:flex-wrap md:overflow-visible md:px-6">
        <div className="cl-seg hidden flex-none md:inline-flex">
          {TABS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="valuation-state"
                checked={tab === option}
                onChange={() => setTab(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <Select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="hidden w-37.5 flex-none text-[13px] md:block"
        >
          <option value="">Any agent</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.user_id}>
              {a.display_name}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="hidden w-37.5 flex-none text-[13px] md:block"
        >
          <option value="waiting">Longest waiting</option>
          <option value="newest">Newest first</option>
          <option value="value">Highest value</option>
        </Select>
      </div>

      <div className="hidden px-6 pt-2 md:block">
        <div className="grid grid-cols-[22px_minmax(230px,1fr)_128px_108px_92px] gap-3 border-b-2 border-(--color-text) pb-2.25">
          <div>
            {canEdit ? (
              <input
                type="checkbox"
                aria-label="Select all"
                checked={sorted.length > 0 && selected.size === sorted.length}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? new Set(sorted.map((v) => v.id))
                      : new Set()
                  )
                }
              />
            ) : null}
          </div>
          <K>Owner &amp; property</K>
          <K>Purpose &amp; class</K>
          <K>State</K>
          <K>Waiting</K>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading
              ? "Loading valuation requests…"
              : "No valuation requests match these filters."}
          </div>
        ) : null}

        {sorted.map((v, index) => {
          const lead = leadFor(v.lead_id)
          return (
            <RowIn key={v.id} index={index}>
              <Link
                href={`/admin/valuations/${v.id}`}
                className={`grid grid-cols-[22px_minmax(230px,1fr)_128px_108px_92px] items-start gap-3 border-b border-(--color-divider) py-3.5 text-(--color-text) hover:bg-neutral-100 ${
                  v.id === selectedId
                    ? "bg-(--color-accent-100) shadow-[inset_3px_0_0_var(--color-accent)]"
                    : ""
                }`}
              >
                <div onClick={(e) => e.preventDefault()}>
                  {canEdit ? (
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggle(v.id)}
                      aria-label={`Select ${lead?.full_name ?? v.location_label}`}
                    />
                  ) : null}
                </div>
                <div>
                  <div className="text-[14.5px]">
                    {lead?.full_name ?? "Owner unavailable"}
                  </div>
                  <div className="cl-fig mt-1 text-[12.5px] text-neutral-700">
                    {lead?.phone ?? "—"}
                  </div>
                  <p className="mt-1.5 mb-0 text-[12.5px] leading-[1.6] text-neutral-700">
                    {v.message || "No message written."}
                  </p>
                </div>
                <div className="text-[12.5px] leading-normal">
                  {v.location_label}
                  <K className="mt-1.5">
                    {titleCase(v.property_type)}
                    {v.property_subtype
                      ? ` · ${titleCase(v.property_subtype)}`
                      : ""}
                  </K>
                  <K className="mt-1.5">{agentName(v.assigned_agent_id)}</K>
                </div>
                <div>
                  <Status tone={STATUS_TONE[v.status]}>
                    {STATUS_LABEL[v.status]}
                  </Status>
                </div>
                <div className="cl-fig text-[13px] text-neutral-600">
                  {v.status === "pending" ? waitingLabel(v.created_at) : "—"}
                </div>
              </Link>
            </RowIn>
          )
        })}

        <div className="flex items-center gap-3.5 pt-4.5 pb-7">
          {canEdit ? (
            <>
              <K>With selected ({selected.size})</K>
              <ButtonLink
                href="#"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  bulkSetStatus("confirmed")
                }}
              >
                Schedule
              </ButtonLink>
              <ButtonLink
                href="#"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  bulkSetStatus("completed")
                }}
              >
                Mark completed
              </ButtonLink>
              <ButtonLink
                href="#"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  bulkSetStatus("cancelled")
                }}
              >
                Close
              </ButtonLink>
            </>
          ) : null}
          <span className="flex-1" />
          <K className="cl-fig">
            {sorted.length} of {valuationRequests.length}
          </K>
        </div>
      </div>

      <div className="mt-3 md:hidden">
        {sorted.map((v, index) => {
          const lead = leadFor(v.lead_id)
          return (
            <RowIn key={v.id} index={index}>
              <Link
                href={`/admin/valuations/${v.id}`}
                className="block border-b border-(--color-divider) px-4 py-3.5 text-(--color-text)"
              >
                <div className="flex items-baseline gap-3">
                  <div className="flex-1 text-[15.5px]">
                    {lead?.full_name ?? "Owner unavailable"}
                  </div>
                  <div className="cl-fig cl-k flex-none text-neutral-600">
                    {v.status === "pending" ? waitingLabel(v.created_at) : ""}
                  </div>
                </div>
                <K className="cl-fig mt-1.5">
                  {v.location_label} · {titleCase(v.property_type)}
                </K>
                {v.message ? (
                  <p className="mt-2 mb-0 text-[13px] leading-[1.6] text-neutral-700">
                    {v.message}
                  </p>
                ) : null}
                <div className="mt-2.25 flex items-center gap-2">
                  <Status tone={STATUS_TONE[v.status]}>
                    {STATUS_LABEL[v.status]}
                  </Status>
                </div>
              </Link>
            </RowIn>
          )
        })}
        <div className="flex items-center gap-3 px-4 py-4.5">
          <K className="cl-fig">
            {sorted.length} of {valuationRequests.length}
          </K>
        </div>
      </div>
    </div>
  )
}
