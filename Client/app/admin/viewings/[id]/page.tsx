"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { ButtonLink, Button } from "../../../_components/ui/button"
import { Input, Select, Textarea } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { Pad } from "../../../_components/Admin/admin-shell"
import { BackIcon } from "../../../_components/Admin/icons"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import { PageIn, useToast } from "../../../_components/Admin/motion"
import { useViewingContext } from "../../../_lib/Context/Viewing Request"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { buildWhatsAppLink } from "../../../_lib/format"
import { budgetLabel, INTENT_LABEL } from "../../leads/_lib"
import { priceLabel } from "../../listings/_lib"
import type { RequestStatus } from "../../../_lib/Types/Viewing Request"
import { dateTimeLabel, STATUS_LABEL, STATUS_TONE } from "../_lib"

export default function AdminViewingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { viewingRequests, loading, editViewingRequest } = useViewingContext(),
    { leads } = useLeadContext(),
    { listings } = useListingContext(),
    { agents } = useAgentContext(),
    { logs } = useLogsContext(),
    push = useToast()

  const viewing = viewingRequests.find((v) => v.id === id)

  const [preferredDate, setPreferredDate] = React.useState(""),
    [preferredSlot, setPreferredSlot] = React.useState(""),
    [alternateDate, setAlternateDate] = React.useState(""),
    [status, setStatus] = React.useState<RequestStatus>("pending"),
    [assignedAgent, setAssignedAgent] = React.useState(""),
    [internalNotes, setInternalNotes] = React.useState(""),
    [cancelledReason, setCancelledReason] = React.useState(""),
    [saving, setSaving] = React.useState(false),
    [lastId, setLastId] = React.useState<string | null>(null)

  if (viewing && viewing.id !== lastId) {
    setLastId(viewing.id)
    setPreferredDate(viewing.preferred_date.slice(0, 10))
    setPreferredSlot(viewing.preferred_time_slot ?? "")
    setAlternateDate(
      viewing.alternate_date ? viewing.alternate_date.slice(0, 10) : ""
    )
    setStatus(viewing.status)
    setAssignedAgent(viewing.assigned_agent_id ?? "")
    setInternalNotes(viewing.internal_notes ?? "")
    setCancelledReason(viewing.cancelled_reason ?? "")
  }

  if (!viewing) {
    return (
      <PageIn>
        <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
          {loading ? "Loading…" : "Viewing request not found."}
        </div>
      </PageIn>
    )
  }

  const lead = leads.find((l) => l.id === viewing.lead_id),
    listing = listings.find((l) => l.id === viewing.listing_id),
    activity = logs
      .filter(
        (l) => l.entity_type === "Viewing Request" && l.entity_id === viewing.id
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

  const waLink = lead
    ? buildWhatsAppLink(
        lead.whatsapp_number || lead.phone,
        `Hi ${lead.full_name.split(" ")[0]}, `
      )
    : "#"

  async function handleSave() {
    setSaving(true)
    try {
      await editViewingRequest(viewing!.id, {
        preferred_date: new Date(preferredDate).toISOString(),
        preferred_time_slot: preferredSlot || null,
        alternate_date: alternateDate
          ? new Date(alternateDate).toISOString()
          : null,
        status,
        assigned_agent_id: assignedAgent || null,
        internal_notes: internalNotes || null,
        cancelled_reason:
          status === "cancelled" ? cancelledReason || null : null,
      })
      push({ title: "Viewing saved" })
    } catch (error) {
      push({ title: "Couldn't save", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    setSaving(true)
    try {
      await editViewingRequest(viewing!.id, {
        status: "cancelled",
        cancelled_reason: cancelledReason || null,
      })
      setStatus("cancelled")
      push({ title: "Request cancelled" })
    } catch (error) {
      push({ title: "Couldn't cancel", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageIn>
      <div className="grid min-h-full grid-rows-[auto_1fr_auto]">
        <div className="flex items-center gap-3 border-b border-(--color-divider) px-4 py-3.5 md:px-7">
          <ButtonLink
            href="/admin/viewings"
            variant="secondary"
            size="icon"
            className="h-8.5 w-8.5 flex-none"
            aria-label="Back to viewings"
          >
            <BackIcon size={16} />
          </ButtonLink>
          <K className="cl-fig min-w-0 flex-1 truncate">
            Viewing · {dateTimeLabel(viewing.created_at)}
          </K>
          <Status tone={STATUS_TONE[viewing.status]}>
            {STATUS_LABEL[viewing.status]}
          </Status>
        </div>

        <div className="bg-neutral-100 pb-7">
          <Pad className="max-w-160 pt-4.5">
            <h2 className="m-0 text-[27px] leading-[1.15] font-normal">
              {lead?.full_name ?? "Visitor unavailable"}
            </h2>
            <K className="cl-fig mt-1.5">
              {lead
                ? `${lead.phone} · ${[lead.city, lead.state_region].filter(Boolean).join(", ") || lead.country_code || "—"}`
                : "No linked lead record"}
            </K>

            <div className="mt-3.5 rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) p-3">
              <K>What they wrote</K>
              <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.75]">
                {viewing.message || lead?.requirements || "Nothing written."}
              </p>
            </div>

            <div className="mt-3.5 flex items-start gap-3">
              <Plate
                matted={false}
                src={listing?.thumbnail_url}
                alt={listing?.title ?? ""}
                className="h-13.5 w-19 flex-none"
                label={listing?.thumbnail_url ? "" : "No plate"}
              />
              <div>
                <div className="text-[13.5px] leading-[1.4]">
                  {listing?.title ?? "Listing unavailable"}
                </div>
                {listing ? (
                  <>
                    <K className="cl-fig mt-1.5">
                      {listing.reference_code} · {priceLabel(listing).price}{" "}
                      {priceLabel(listing).priceUnit}
                    </K>
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="mt-1.5 inline-block text-[12.5px]"
                    >
                      Open listing →
                    </Link>
                  </>
                ) : null}
              </div>
            </div>

            {lead ? (
              <div className="mt-4">
                <SectionHead>Visitor profile</SectionHead>
                <Pair label="Phone">{lead.phone}</Pair>
                <Pair label="Intent">{INTENT_LABEL[lead.intent]}</Pair>
                <Pair label="Budget">{budgetLabel(lead) ?? "Not given"}</Pair>
                <Pair label="Preferred location">
                  {lead.preferred_location || "—"}
                </Pair>
              </div>
            ) : null}

            <div className="mt-4">
              <SectionHead>What the visitor asked for</SectionHead>
              <Pair label="Preferred date">
                {new Date(viewing.preferred_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Pair>
              <Pair label="Preferred time">
                {viewing.preferred_time_slot ?? "No preference given"}
              </Pair>
              <Pair label="Alternate date">
                {viewing.alternate_date
                  ? new Date(viewing.alternate_date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "None given"}
              </Pair>
            </div>

            <div className="mt-4">
              <SectionHead>Schedule &amp; assignment</SectionHead>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <label className="flex flex-col gap-1.5">
                  <K>Date</K>
                  <Input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="cl-fig text-[13px]"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <K>Time</K>
                  <Input
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    placeholder="14:00 or morning"
                    className="text-[13px]"
                  />
                </label>
              </div>
              <label className="mt-2.5 flex flex-col gap-1.5">
                <K>Alternate date</K>
                <Input
                  type="date"
                  value={alternateDate}
                  onChange={(e) => setAlternateDate(e.target.value)}
                  className="cl-fig text-[13px]"
                />
              </label>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <label className="flex flex-col gap-1.5">
                  <K>State</K>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RequestStatus)}
                    className="text-[13px]"
                  >
                    {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <K>Assigned agent</K>
                  <Select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="text-[13px]"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.user_id}>
                        {a.display_name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              {status === "cancelled" ? (
                <label className="mt-2.5 flex flex-col gap-1.5">
                  <K>Cancellation reason</K>
                  <Input
                    value={cancelledReason}
                    onChange={(e) => setCancelledReason(e.target.value)}
                    className="text-[13px]"
                  />
                </label>
              ) : null}

              <label className="mt-2.5 flex flex-col gap-1.5">
                <K>Internal notes</K>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="min-h-17.5 text-[13px]"
                  placeholder="Kept internal — never shown to the visitor"
                />
              </label>

              <p className="mt-2 mb-0 text-[12.5px] leading-normal text-neutral-700">
                Confirming here does not message the visitor automatically — use
                the WhatsApp button below once you&apos;ve saved.
              </p>
            </div>

            <div className="mt-4">
              <SectionHead>Activity</SectionHead>
              {activity.length === 0 ? (
                <div className="mt-3 text-[13px] text-neutral-600">
                  No recorded activity for this request yet.
                </div>
              ) : (
                <div className="mt-3 flex flex-col">
                  {activity.map((log, i) => (
                    <div
                      key={log.id}
                      className={`flex gap-2.5 py-2.5 ${i < activity.length - 1 ? "border-b border-(--color-divider)" : ""}`}
                    >
                      <span className="cl-fig cl-k flex-none text-(--color-accent)">
                        {dateTimeLabel(log.created_at)}
                      </span>
                      <div className="flex-1 text-[13px]">{log.action}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Pad>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-(--color-divider) bg-(--color-bg) px-4 py-3 md:px-7">
          {lead ? (
            <ButtonLink
              href={waLink}
              variant="secondary"
              className="flex-1 md:max-w-50"
            >
              WhatsApp
            </ButtonLink>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="flex-1 md:max-w-50"
            disabled={saving || viewing.status === "cancelled"}
            onClick={handleCancel}
          >
            Cancel request
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 text-(--color-accent) md:max-w-55"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </PageIn>
  )
}
