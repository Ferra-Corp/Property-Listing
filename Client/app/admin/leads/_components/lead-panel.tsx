"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Select, Textarea, Input } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useActivityContext } from "../../../_lib/Context/Lead Activity"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useUserContext } from "../../../_lib/Context/User"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useNotificationContext } from "../../../_lib/Context/Notification"
import { usePermission } from "../../../_lib/permissions"
import { buildWhatsAppLink } from "../../../_lib/format"
import { priceLabel } from "../../listings/_lib"
import type { LeadActivity } from "../../../_lib/Types/Lead Activity"
import type { LeadStatus } from "../../../_lib/Types/Lead"
import {
  budgetLabel,
  dateTimeLabel,
  INTENT_LABEL,
  SOURCE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
} from "../_lib"

const QUICK_TYPES = [
  "call",
  "whatsapp",
  "email",
  "meeting",
  "note",
  "status_change",
]

export function LeadPanel({ id }: { id: string }) {
  const { leads, loading, editLead } = useLeadContext(),
    { createActivity, getActivitiesByLead } = useActivityContext(),
    { agents } = useAgentContext(),
    { users } = useUserContext(),
    { listings } = useListingContext(),
    { notifications } = useNotificationContext(),
    push = useToast(),
    router = useRouter(),
    canEdit = usePermission("Edit lead")

  const sorted = [...leads].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    index = sorted.findIndex((l) => l.id === id),
    lead = sorted[index]

  const [trail, setTrail] = React.useState<LeadActivity[]>([]),
    [assignAgent, setAssignAgent] = React.useState(""),
    [activityType, setActivityType] = React.useState("call"),
    [activityBody, setActivityBody] = React.useState(""),
    [occurredAt, setOccurredAt] = React.useState(""),
    [nextStatus, setNextStatus] = React.useState<LeadStatus | "">(""),
    [saving, setSaving] = React.useState(false),
    [lastId, setLastId] = React.useState<string | null>(null)

  if (lead && lead.id !== lastId) {
    setLastId(lead.id)
    setAssignAgent(lead.assigned_agent_id ?? "")
    setOccurredAt(new Date().toISOString().slice(0, 16))
    setNextStatus("")
  }

  React.useEffect(() => {
    if (!lead) return
    getActivitiesByLead(lead.id)
      .then(setTrail)
      .catch(() => setTrail([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id])

  if (!lead) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
        {loading ? "Loading…" : "Lead not found."}
      </div>
    )
  }

  const prev = index > 0 ? sorted[index - 1] : null,
    next = index < sorted.length - 1 ? sorted[index + 1] : null,
    listing = lead.listing_id
      ? listings.find((l) => l.id === lead.listing_id)
      : undefined,
    receipts = notifications.filter(
      (n) =>
        n.related_type?.toLowerCase() === "lead" && n.related_id === lead.id
    )

  async function handleReassign() {
    try {
      await editLead(lead.id, { assigned_agent_id: assignAgent || null })
      push({
        title: "Lead reassigned",
        body: assignAgent
          ? agents.find((a) => a.user_id === assignAgent)?.display_name
          : "Unassigned",
      })
    } catch (error) {
      push({ title: "Couldn't reassign", body: (error as Error).message })
    }
  }

  async function handleRecordActivity() {
    if (!activityBody.trim() && !nextStatus) {
      push({ title: "Write something or change the status first" })
      return
    }
    setSaving(true)
    try {
      if (activityBody.trim()) {
        await createActivity({
          lead_id: lead.id,
          type: activityType,
          body: activityBody.trim(),
          occurred_at: occurredAt
            ? new Date(occurredAt).toISOString()
            : undefined,
        })
      }

      if (nextStatus) {
        const patch: { status: LeadStatus; first_contacted_at?: string } = {
          status: nextStatus,
        }
        if (!lead.first_contacted_at && nextStatus !== "new")
          patch.first_contacted_at = occurredAt
            ? new Date(occurredAt).toISOString()
            : new Date().toISOString()
        await editLead(lead.id, patch)
      }

      const freshTrail = await getActivitiesByLead(lead.id)
      setTrail(freshTrail)
      setActivityBody("")
      setNextStatus("")
      push({ title: "Recorded" })
    } catch (error) {
      push({ title: "Couldn't record that", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const waLink = buildWhatsAppLink(
    lead.whatsapp_number || lead.phone,
    `Hi ${lead.full_name.split(" ")[0]}, `
  )

  return (
    <div className="bg-neutral-100">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-neutral-100)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-5.5">
        <K className="cl-fig min-w-0 flex-1 truncate">
          Lead · {lead.full_name}
        </K>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Previous"
          disabled={!prev}
          onClick={() => prev && router.push(`/admin/leads/${prev.id}`)}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Next"
          disabled={!next}
          onClick={() => next && router.push(`/admin/leads/${next.id}`)}
        >
          ↓
        </Button>
        <ButtonLink
          href="/admin/leads"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Close"
        >
          ×
        </ButtonLink>
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <h2 className="m-0 text-[27px] leading-[1.15] font-normal md:text-[29px]">
              {lead.full_name}
            </h2>
            <div className="cl-fig mt-1.5 text-[13.5px] text-neutral-700">
              {lead.phone}
              {lead.email ? ` · ${lead.email}` : ""}
            </div>
          </div>
          <span className="flex-1" />
          <Status tone={STATUS_TONE[lead.status]}>
            {STATUS_LABEL[lead.status]}
          </Status>
        </div>

        <div className="mt-4 hidden flex-col gap-2 md:flex">
          <div className="flex gap-2">
            <ButtonLink href={waLink} variant="primary" className="flex-1">
              WhatsApp reply
            </ButtonLink>
            <ButtonLink
              href={`tel:${lead.phone}`}
              variant="primary"
              className="flex-1"
            >
              Call now
            </ButtonLink>
          </div>
          <div className="flex gap-2">
            {lead.email ? (
              <ButtonLink
                href={`mailto:${lead.email}`}
                variant="secondary"
                className="flex-1"
              >
                Email
              </ButtonLink>
            ) : (
              <Button variant="secondary" className="flex-1" disabled>
                No email on file
              </Button>
            )}
            <ButtonLink
              href="/admin/viewings"
              variant="secondary"
              className="flex-1"
            >
              Book a viewing
            </ButtonLink>
          </div>
        </div>

        <div className="mt-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) p-4">
          <K>What they wrote</K>
          <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.75] md:text-[14px]">
            {lead.requirements ||
              "Nothing written — check how they came in below."}
          </p>
        </div>

        <div className="mt-3 flex gap-2 md:hidden">
          {lead.email ? (
            <ButtonLink
              href={`mailto:${lead.email}`}
              variant="secondary"
              className="flex-1"
            >
              Email
            </ButtonLink>
          ) : null}
          <ButtonLink
            href="/admin/viewings"
            variant="secondary"
            className="flex-1"
          >
            Book a viewing
          </ButtonLink>
        </div>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>The enquiry</SectionHead>
        <Pair label="Intention">{INTENT_LABEL[lead.intent]}</Pair>
        <Pair label="Property type">
          {lead.property_type ? lead.property_type : "Not specified"}
          {lead.property_subtype
            ? ` · ${lead.property_subtype.replaceAll("_", " ")}`
            : ""}
        </Pair>
        <Pair label="Preferred location">{lead.preferred_location || "—"}</Pair>
        <Pair label="Budget">{budgetLabel(lead) ?? "Not given"}</Pair>
        <Pair label="Based in">
          {[lead.city, lead.state_region, lead.country_code]
            .filter(Boolean)
            .join(", ") || "—"}
        </Pair>
        <Pair label="Marketing consent">
          <span
            className={`cl-k ${lead.consent_marketing ? "text-(--color-accent)" : "text-neutral-600"}`}
          >
            {lead.consent_marketing ? "Given" : "Not given"}
          </span>
        </Pair>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Came from</SectionHead>
        {listing ? (
          <div className="flex items-start gap-3 border-b border-(--color-divider) py-3.5">
            <Plate
              matted={false}
              src={listing.thumbnail_url}
              alt={listing.title}
              className="h-12.5 w-18 flex-none"
              label={listing.thumbnail_url ? "" : "No plate"}
            />
            <div>
              <div className="text-[13.5px] leading-[1.4]">{listing.title}</div>
              <K className="cl-fig mt-1.25">
                {listing.reference_code} · {priceLabel(listing).price}{" "}
                {priceLabel(listing).priceUnit}
              </K>
              <Link
                href={`/admin/listings/${listing.id}`}
                className="mt-1.5 inline-block text-[12.5px]"
              >
                Open listing →
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-b border-(--color-divider) py-3.5 text-[13px] text-neutral-600">
            Not tied to a specific listing — a general enquiry.
          </div>
        )}
        <Pair label="Source">{SOURCE_LABEL[lead.source]}</Pair>
        {lead.source_page ? (
          <Pair label="Landing page">
            <code className="cl-mono text-[11.5px]">{lead.source_page}</code>
          </Pair>
        ) : null}
        {lead.referrer ? <Pair label="Referrer">{lead.referrer}</Pair> : null}
        {lead.utm_source ? (
          <Pair label="UTM source">{lead.utm_source}</Pair>
        ) : null}
        {lead.utm_campaign ? (
          <Pair label="UTM campaign">{lead.utm_campaign}</Pair>
        ) : null}
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Assignment</SectionHead>
        {canEdit ? (
          <div className="mt-3 flex gap-2">
            <Select
              value={assignAgent}
              onChange={(e) => setAssignAgent(e.target.value)}
              className="flex-1 text-[13px]"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.user_id}>
                  {a.display_name}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              className="flex-none"
              disabled={assignAgent === (lead.assigned_agent_id ?? "")}
              onClick={handleReassign}
            >
              Reassign
            </Button>
          </div>
        ) : (
          <Pair label="Assigned to">
            {lead.assigned_agent_id
              ? (agents.find((a) => a.user_id === lead.assigned_agent_id)
                  ?.display_name ?? "—")
              : "Unassigned"}
          </Pair>
        )}
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Notification receipt</SectionHead>
        {receipts.length === 0 ? (
          <div className="mt-3 text-[13px] text-neutral-600">
            No delivery record for this lead yet.
          </div>
        ) : (
          receipts.map((r) => (
            <Pair key={r.id} label={`${r.channel} to ${r.recipient}`}>
              <span
                className={`cl-k ${r.status === "sent" ? "text-(--color-accent)" : "text-neutral-600"}`}
              >
                {r.status}
                {r.sent_at ? ` · ${dateTimeLabel(r.sent_at)}` : ""}
              </span>
            </Pair>
          ))
        )}
      </div>

      {canEdit ? (
        <div className="px-4 pt-4.5 md:px-5.5">
          <SectionHead>Record an encounter</SectionHead>
          <K className="mt-2.25">
            Writes a row to <code className="cl-mono">lead_activities</code>
          </K>

          <div className="scr mt-3 flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
            {QUICK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActivityType(type)}
                className={`cl-mono inline-flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] ${
                  activityType === type
                    ? "border-(--color-accent) bg-(--color-accent-100) text-(--color-accent-800)"
                    : "border-(--color-divider) text-neutral-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <Input
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            placeholder="Or type a custom activity kind"
            className="mt-2 text-[13px]"
          />

          <Textarea
            value={activityBody}
            onChange={(e) => setActivityBody(e.target.value)}
            className="mt-3 min-h-20.5 text-[13px]"
            placeholder="What was said, what was agreed, what they're waiting on — kept internal, never sent to the lead"
          />

          <div className="mt-2.5 grid gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <K className="cl-mono">occurred_at</K>
              <Input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="cl-fig text-[13px]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <K>Also set the state</K>
              <Select
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as LeadStatus | "")
                }
                className="text-[13px]"
              >
                <option value="">Leave as {STATUS_LABEL[lead.status]}</option>
                {(Object.keys(STATUS_LABEL) as LeadStatus[])
                  .filter((s) => s !== lead.status)
                  .map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
              </Select>
            </label>
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex-1" />
            <Button
              type="button"
              variant="primary"
              className="flex-none"
              disabled={saving}
              onClick={handleRecordActivity}
            >
              {saving ? "Recording…" : "Record it"}
            </Button>
          </div>
          <K className="mt-2.25 leading-[1.7]">
            Changing the state records a{" "}
            <span className="cl-fig">status_change</span> on the lead itself,
            whether or not you write a body.
          </K>
        </div>
      ) : null}

      <div className="px-4 pt-4.5 pb-7 md:px-5.5">
        <div className="flex items-baseline gap-3 border-b-2 border-(--color-text) pb-1.5">
          <K>The trail</K>
          <span className="flex-1" />
          <K className="cl-fig">
            {trail.length} activit{trail.length === 1 ? "y" : "ies"} · newest
            first
          </K>
        </div>

        {trail.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-neutral-600">
            Nothing recorded for this lead yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {[...trail]
              .sort(
                (a, b) =>
                  new Date(b.occurred_at).getTime() -
                  new Date(a.occurred_at).getTime()
              )
              .map((entry) => (
                <div
                  key={entry.id}
                  className="border-b border-(--color-divider) py-3.5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Status tone="neutral">{entry.type}</Status>
                    <K className="cl-fig">{dateTimeLabel(entry.occurred_at)}</K>
                    <span className="hidden flex-1 md:block" />
                    <K>
                      {users.find((u) => u.id === entry.user_id)?.name ?? "—"}
                    </K>
                  </div>
                  {entry.body ? (
                    <p className="mt-2 mb-0 text-[13.5px] leading-[1.7]">
                      {entry.body}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-(--color-divider) bg-(--color-bg) px-4 py-3 md:hidden">
        <ButtonLink href={waLink} variant="primary" className="flex-1">
          WhatsApp reply
        </ButtonLink>
        <ButtonLink
          href={`tel:${lead.phone}`}
          variant="primary"
          className="flex-1"
        >
          Call now
        </ButtonLink>
      </div>
    </div>
  )
}
