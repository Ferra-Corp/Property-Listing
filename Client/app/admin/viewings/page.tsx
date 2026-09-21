"use client"

import * as React from "react"
import Link from "next/link"
import { PageHead, Pad, Toolbar } from "../../_components/Admin/admin-shell"
import { K, Notes, Status, Td, Th } from "../../_components/Admin/ui"
import { MotionTr, PageIn, RowIn } from "../../_components/Admin/motion"
import { useViewingContext } from "../../_lib/Context/Viewing Request"
import { useLeadContext } from "../../_lib/Context/Lead"
import { useListingContext } from "../../_lib/Context/Listing"
import {
  dateLabel,
  isToday,
  STATUS_LABEL,
  STATUS_TONE,
  waitingLabel,
} from "./_lib"

const NOTES = [
  {
    label: "Request states",
    body: "Pending: visitor booked but the request hasn't been confirmed. Confirmed: an exact date and time have been set. Completed: the viewing happened. Cancelled: visitor or agent called it off. No-show: confirmed but the visitor never attended.",
  },
  {
    label: "Confirmation workflow",
    body: "Open the request, check the visitor's preference against the property's diary, then set the exact date and time slot and set the state to Confirmed — the confirmation timestamp is recorded automatically.",
  },
  {
    label: "Notifying visitors",
    body: "There's no automatic WhatsApp or SMS confirmation yet — use the WhatsApp button on the request to let them know by hand once you've confirmed.",
  },
]

const TABS = ["Pending", "Confirmed", "Today", "All"] as const

export default function AdminViewingsPage() {
  const { viewingRequests, loading } = useViewingContext(),
    { leads } = useLeadContext(),
    { listings } = useListingContext(),
    [tab, setTab] = React.useState<(typeof TABS)[number]>("Pending"),
    [query, setQuery] = React.useState("")

  const leadFor = (leadId: string) => leads.find((l) => l.id === leadId),
    listingFor = (listingId: string) => listings.find((l) => l.id === listingId)

  const filtered = viewingRequests.filter((v) => {
    if (tab === "Pending" && v.status !== "pending") return false
    if (tab === "Confirmed" && v.status !== "confirmed") return false
    if (tab === "Today" && !isToday(v.preferred_date)) return false
    if (query.trim()) {
      const lead = leadFor(v.lead_id),
        listing = listingFor(v.listing_id)
      const haystack =
        `${lead?.full_name ?? ""} ${lead?.phone ?? ""} ${listing?.title ?? ""} ${listing?.reference_code ?? ""} ${v.status}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(a.preferred_date).getTime() -
      new Date(b.preferred_date).getTime()
  )

  const pendingCount = viewingRequests.filter(
      (v) => v.status === "pending"
    ).length,
    confirmedThisWeekCount = viewingRequests.filter((v) => {
      if (v.status !== "confirmed") return false
      const d = new Date(v.preferred_date),
        now = new Date(),
        weekAhead = new Date(now)
      weekAhead.setDate(now.getDate() + 7)
      return d >= now && d <= weekAhead
    }).length,
    thisMonthCount = viewingRequests.filter((v) => {
      const d = new Date(v.created_at),
        now = new Date()
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      )
    }).length

  return (
    <PageIn>
      <PageHead
        title="Viewings"
        meta={`${pendingCount} pending · ${confirmedThisWeekCount} confirmed this week · ${thisMonthCount} this month`}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, listing or status"
          className="cl-input hidden w-55 text-[13px] md:block"
        />
      </PageHead>

      <div className="px-4 pt-3.5 md:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, listing or status"
          className="cl-input w-full text-[13px]"
        />
      </div>

      <Toolbar>
        <div className="cl-seg flex-none">
          {TABS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="viewing-tab"
                checked={tab === option}
                onChange={() => setTab(option)}
              />
              {option === "Pending" ? `Pending · ${pendingCount}` : option}
            </label>
          ))}
        </div>
      </Toolbar>

      <Pad className="hidden pt-4.5 md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-27.5">Preferred date</Th>
              <Th>Property · visitor</Th>
              <Th className="w-37.5">Time slot</Th>
              <Th className="w-27.5">Status</Th>
              <Th className="w-27.5">Waiting</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <Td
                  colSpan={5}
                  className="py-10 text-center text-[13.5px] text-neutral-600"
                >
                  No viewing requests match these filters.
                </Td>
              </tr>
            ) : null}
            {sorted.map((viewing, index) => {
              const lead = leadFor(viewing.lead_id),
                listing = listingFor(viewing.listing_id)
              return (
                <MotionTr
                  key={viewing.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(index, 12) * 0.03,
                  }}
                  className="[&:hover_td]:bg-neutral-100"
                >
                  <Td className="cl-fig text-[12.5px]">
                    {dateLabel(viewing.preferred_date)}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/viewings/${viewing.id}`}
                      className="text-[14.5px] text-(--color-text)"
                    >
                      {listing?.title ?? "Listing unavailable"}
                    </Link>
                    {listing ? (
                      <K className="cl-fig mt-1">{listing.reference_code}</K>
                    ) : null}
                    <div className="mt-1.5 text-[13px] text-neutral-700">
                      {lead
                        ? `${lead.full_name} · ${lead.phone}`
                        : "Visitor unavailable"}
                    </div>
                  </Td>
                  <Td className="text-[13px]">
                    {viewing.preferred_time_slot ?? "—"}
                  </Td>
                  <Td>
                    <Status tone={STATUS_TONE[viewing.status]}>
                      {STATUS_LABEL[viewing.status]}
                    </Status>
                  </Td>
                  <Td className="cl-fig text-[13px] text-neutral-600">
                    {viewing.status === "pending"
                      ? waitingLabel(viewing.created_at)
                      : "—"}
                  </Td>
                </MotionTr>
              )
            })}
          </tbody>
        </table>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading
              ? "Loading viewing requests…"
              : "No viewing requests match these filters."}
          </div>
        ) : null}

        <div className="flex items-center gap-3.5 pt-4.5">
          <span className="flex-1" />
          <K className="cl-fig">
            {sorted.length} of {viewingRequests.length}
          </K>
        </div>
      </Pad>

      <div className="mt-1 md:hidden">
        {sorted.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600">
            {loading
              ? "Loading viewing requests…"
              : "No viewing requests match these filters."}
          </div>
        ) : (
          sorted.map((viewing, index) => {
            const lead = leadFor(viewing.lead_id),
              listing = listingFor(viewing.listing_id)
            return (
              <RowIn key={viewing.id} index={index}>
                <Link
                  href={`/admin/viewings/${viewing.id}`}
                  className="block border-b border-(--color-divider) px-4 py-3.5 text-(--color-text)"
                >
                  <div className="flex items-baseline gap-3">
                    <div className="flex-1 text-[14.5px]">
                      {listing?.title ?? "Listing unavailable"}
                    </div>
                    <div className="cl-fig cl-k flex-none text-neutral-600">
                      {viewing.status === "pending"
                        ? waitingLabel(viewing.created_at)
                        : ""}
                    </div>
                  </div>
                  {listing ? (
                    <K className="cl-fig mt-1.5">{listing.reference_code}</K>
                  ) : null}
                  <div className="mt-1.5 text-[13px] text-neutral-700">
                    {lead ? lead.full_name : "Visitor unavailable"} ·{" "}
                    {dateLabel(viewing.preferred_date)} ·{" "}
                    {viewing.preferred_time_slot ?? "—"}
                  </div>
                  <div className="mt-2">
                    <Status tone={STATUS_TONE[viewing.status]}>
                      {STATUS_LABEL[viewing.status]}
                    </Status>
                  </div>
                </Link>
              </RowIn>
            )
          })
        )}
      </div>

      <Pad className="py-7 md:pb-8.5">
        <Notes items={NOTES} />
      </Pad>
    </PageIn>
  )
}
