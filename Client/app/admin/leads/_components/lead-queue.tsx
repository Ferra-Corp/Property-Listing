"use client"

import * as React from "react"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { Chip, K, Status } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useSettingContext } from "../../../_lib/Context/Site Setting"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useUserContext } from "../../../_lib/Context/User"
import type { LeadStatus } from "../../../_lib/Types/Lead"
import {
  inQueueFilter,
  SOURCE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  waitingFor,
  type QueueFilter,
} from "../_lib"

const QUEUE_FILTERS: QueueFilter[] = [
  "New",
  "Contacted",
  "Open",
  "Closed",
  "All",
]

export function LeadQueue({ selectedId }: { selectedId?: string }) {
  const { leads, editLead, loading } = useLeadContext(),
    { agents } = useAgentContext(),
    { settings } = useSettingContext(),
    { listings } = useListingContext(),
    { users } = useUserContext(),
    push = useToast(),
    [stateFilter, setStateFilter] = React.useState<QueueFilter>("New"),
    [agentFilter, setAgentFilter] = React.useState(""),
    [sort, setSort] = React.useState<"oldest" | "newest" | "waiting">("oldest"),
    [query, setQuery] = React.useState(""),
    [selected, setSelected] = React.useState<Set<string>>(new Set())

  const agentName = (userId: string | null) =>
    userId
      ? (agents.find((a) => a.user_id === userId)?.display_name ?? "Unassigned")
      : "Unassigned"

  const unclaimedAssigneeId = settings.find(
      (s) => s.key === "leads.unclaimed_assignee"
    )?.value?.value,
    unclaimedAssigneeName = unclaimedAssigneeId
      ? users.find((u) => u.id === unclaimedAssigneeId)?.name
      : null

  const listingFor = (listingId: string | null) =>
    listingId ? listings.find((l) => l.id === listingId) : undefined

  const filtered = leads.filter((l) => {
    if (!inQueueFilter(l.status, stateFilter)) return false
    if (agentFilter === "unassigned" && l.assigned_agent_id) return false
    if (
      agentFilter &&
      agentFilter !== "unassigned" &&
      l.assigned_agent_id !== agentFilter
    )
      return false
    if (query.trim()) {
      const haystack =
        `${l.full_name} ${l.phone} ${l.email ?? ""} ${l.requirements ?? ""}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === "waiting") {
      const aOverdue = waitingFor(a, settings).overdue,
        bOverdue = waitingFor(b, settings).overdue
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const counts = {
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    open: leads.filter((l) =>
      ["qualified", "viewing_booked", "negotiating"].includes(l.status)
    ).length,
  }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const thisMonth = leads.filter(
    (l) => new Date(l.created_at) >= monthStart
  ).length

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkSetStatus(status: LeadStatus) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    try {
      await Promise.all(
        ids.map((id) => {
          const lead = leads.find((l) => l.id === id)
          const patch: { status: LeadStatus; first_contacted_at?: string } = {
            status,
          }
          if (status !== "new" && lead && !lead.first_contacted_at)
            patch.first_contacted_at = new Date().toISOString()
          return editLead(id, patch)
        })
      )
      push({
        title: `${ids.length} lead${ids.length === 1 ? "" : "s"} moved to ${STATUS_LABEL[status].toLowerCase()}`,
      })
      setSelected(new Set())
    } catch (error) {
      push({
        title: "Couldn't update those leads",
        body: (error as Error).message,
      })
    }
  }

  return (
    <div className="min-w-0 border-r-0 border-(--color-divider) md:border-r">
      <PageHead
        title="Leads"
        meta={`${counts.new} new · ${counts.contacted} contacted · ${counts.open} open · ${thisMonth} this month${unclaimedAssigneeName ? ` · unclaimed go to ${unclaimedAssigneeName}` : ""}`}
        search="Name, phone or requirements"
      >
        <ButtonLink
          href="/admin/leads"
          variant="secondary"
          className="hidden md:inline-flex"
        >
          Export
        </ButtonLink>
      </PageHead>

      <div className="px-4 pt-3.5 md:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, phone or requirements"
          className="cl-input w-full text-[13px]"
        />
      </div>

      <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-3.5 md:flex-wrap md:overflow-visible md:px-6">
        <div className="cl-seg hidden flex-none md:inline-flex">
          {QUEUE_FILTERS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="lead-state"
                checked={stateFilter === option}
                onChange={() => setStateFilter(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <div className="flex gap-1.75 md:hidden">
          {QUEUE_FILTERS.map((option) => (
            <Chip
              key={option}
              on={stateFilter === option}
              onClick={() => setStateFilter(option)}
            >
              {option}
            </Chip>
          ))}
        </div>
        <Select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="hidden w-40 flex-none text-[13px] md:block"
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
          className="hidden w-40 flex-none text-[13px] md:block"
        >
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
          <option value="waiting">Longest unanswered</option>
        </Select>
      </div>

      <div className="hidden px-6 pt-2 md:block">
        <div className="grid grid-cols-[22px_minmax(250px,1fr)_132px_100px_96px] gap-3 border-b-2 border-(--color-text) pb-2.25">
          <div>
            <input
              type="checkbox"
              aria-label="Select all"
              checked={sorted.length > 0 && selected.size === sorted.length}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? new Set(sorted.map((l) => l.id))
                    : new Set()
                )
              }
            />
          </div>
          <K>Person &amp; enquiry</K>
          <K>Listing &amp; source</K>
          <K>State</K>
          <K>Waiting</K>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading ? "Loading leads…" : "No leads match these filters."}
          </div>
        ) : null}

        {sorted.map((lead) => {
          const listing = listingFor(lead.listing_id),
            waiting = waitingFor(lead, settings)
          return (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className={`grid grid-cols-[22px_minmax(250px,1fr)_132px_100px_96px] items-start gap-3 border-b border-(--color-divider) py-3.5 text-(--color-text) last:border-b-0 hover:bg-neutral-100 ${
                lead.id === selectedId
                  ? "bg-(--color-accent-100) shadow-[inset_3px_0_0_var(--color-accent)]"
                  : ""
              }`}
            >
              <div onClick={(e) => e.preventDefault()}>
                <input
                  type="checkbox"
                  checked={selected.has(lead.id)}
                  onChange={() => toggle(lead.id)}
                  aria-label={`Select ${lead.full_name}`}
                />
              </div>
              <div>
                <div className="text-[14.5px]">{lead.full_name}</div>
                <div className="cl-fig mt-1 text-[12.5px] text-neutral-700">
                  {lead.phone}
                </div>
                {lead.requirements ? (
                  <p className="mt-1.5 mb-0 line-clamp-2 text-[12.5px] leading-[1.6] text-neutral-700">
                    {lead.requirements}
                  </p>
                ) : null}
              </div>
              <div className="text-[12.5px] leading-normal">
                {listing ? (
                  listing.title
                ) : (
                  <span className="text-neutral-500">General enquiry</span>
                )}
                {listing ? (
                  <K className="cl-fig mt-1.25">{listing.reference_code}</K>
                ) : null}
                <K className="mt-1.25 text-neutral-700">
                  {SOURCE_LABEL[lead.source]}
                </K>
              </div>
              <div>
                <Status tone={STATUS_TONE[lead.status]}>
                  {STATUS_LABEL[lead.status]}
                </Status>
                <K className="mt-1.5">{agentName(lead.assigned_agent_id)}</K>
              </div>
              <div
                className={`cl-fig text-[13px] ${
                  waiting.overdue
                    ? "text-(--color-accent-2)"
                    : "text-neutral-600"
                }`}
              >
                {waiting.label}
                {waiting.slaLabel && !lead.first_contacted_at ? (
                  <K className="mt-1.25">{waiting.slaLabel}</K>
                ) : null}
              </div>
            </Link>
          )
        })}

        <div className="flex items-center gap-3.5 pt-4.5 pb-7">
          <K>With selected ({selected.size})</K>
          <ButtonLink
            href="#"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("contacted")
            }}
          >
            Mark contacted
          </ButtonLink>
          <ButtonLink
            href="#"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("won")
            }}
          >
            Close · won
          </ButtonLink>
          <ButtonLink
            href="#"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("lost")
            }}
          >
            Close · lost
          </ButtonLink>
          <span className="flex-1" />
          <K className="cl-fig">
            {sorted.length} of {leads.length}
          </K>
        </div>
      </div>

      <div className="mt-3 md:hidden">
        {sorted.map((lead) => {
          const waiting = waitingFor(lead, settings)
          return (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="block border-b border-(--color-divider) px-4 py-3.5 text-(--color-text)"
            >
              <div className="flex items-baseline gap-3">
                <div className="flex-1 text-[15.5px]">{lead.full_name}</div>
                <div
                  className={`cl-fig cl-k flex-none ${
                    waiting.overdue
                      ? "text-(--color-accent-2)"
                      : "text-neutral-600"
                  }`}
                >
                  {waiting.label}
                </div>
              </div>
              <K className="cl-fig mt-1.5">{lead.phone}</K>
              {lead.requirements ? (
                <p className="mt-2 mb-0 line-clamp-2 text-[13px] leading-[1.6] text-neutral-700">
                  {lead.requirements}
                </p>
              ) : null}
              <div className="mt-2.25 flex items-center gap-2">
                <Status tone={STATUS_TONE[lead.status]}>
                  {STATUS_LABEL[lead.status]}
                </Status>
                <K>{SOURCE_LABEL[lead.source]}</K>
              </div>
            </Link>
          )
        })}
        <div className="flex items-center gap-3 px-4 py-4.5">
          <K className="cl-fig">
            {sorted.length} of {leads.length}
          </K>
        </div>
      </div>
    </div>
  )
}
