"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Input, Select, Textarea } from "../../../_components/ui/field"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useValuationContext } from "../../../_lib/Context/Valuation Request"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useUserContext } from "../../../_lib/Context/User"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { buildWhatsAppLink, formatMoney } from "../../../_lib/format"
import { INTENT_LABEL } from "../../leads/_lib"
import { titleCase } from "../../listings/_lib"
import type {
  PropertyCondition,
  RequestStatus,
} from "../../../_lib/Types/Valuation Request"
import {
  dateTimeLabel,
  perAreaLabel,
  STATUS_LABEL,
  STATUS_TONE,
  vsOwnerLabel,
} from "../_lib"

const CONDITIONS: PropertyCondition[] = ["good", "average", "poor"]

export function ValuationPanel({ id }: { id: string }) {
  const { valuationRequests, loading, editValuationRequest } =
      useValuationContext(),
    { leads } = useLeadContext(),
    { agents } = useAgentContext(),
    { users } = useUserContext(),
    { listings } = useListingContext(),
    { logs } = useLogsContext(),
    push = useToast(),
    router = useRouter()

  const sorted = [...valuationRequests].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    index = sorted.findIndex((v) => v.id === id),
    valuation = sorted[index]

  const [estimatedValue, setEstimatedValue] = React.useState(""),
    [condition, setCondition] = React.useState<PropertyCondition | "">(""),
    [evaluationNotes, setEvaluationNotes] = React.useState(""),
    [visitScheduledAt, setVisitScheduledAt] = React.useState(""),
    [assignedAgent, setAssignedAgent] = React.useState(""),
    [valuedBy, setValuedBy] = React.useState(""),
    [listOut, setListOut] = React.useState(false),
    [status, setStatus] = React.useState<RequestStatus>("pending"),
    [saving, setSaving] = React.useState(false),
    [lastId, setLastId] = React.useState<string | null>(null)

  if (valuation && valuation.id !== lastId) {
    setLastId(valuation.id)
    setEstimatedValue(
      valuation.estimated_value != null ? String(valuation.estimated_value) : ""
    )
    setCondition(valuation.condition ?? "")
    setEvaluationNotes(valuation.evaluation_notes ?? "")
    setVisitScheduledAt(
      valuation.visit_scheduled_at
        ? valuation.visit_scheduled_at.slice(0, 16)
        : ""
    )
    setAssignedAgent(valuation.assigned_agent_id ?? "")
    setValuedBy(valuation.valued_by ?? "")
    setListOut(valuation.list_out)
    setStatus(valuation.status)
  }

  if (!valuation) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
        {loading ? "Loading…" : "Valuation request not found."}
      </div>
    )
  }

  const prev = index > 0 ? sorted[index - 1] : null,
    next = index < sorted.length - 1 ? sorted[index + 1] : null,
    lead = leads.find((l) => l.id === valuation.lead_id),
    convertedListing = valuation.converted_listing_id
      ? listings.find((l) => l.id === valuation.converted_listing_id)
      : undefined,
    activity = logs
      .filter(
        (l) =>
          l.entity_type === "Valuation Request" && l.entity_id === valuation.id
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
      const newEstimatedValue = estimatedValue.trim()
        ? Number(estimatedValue)
        : null
      const gettingValued =
        newEstimatedValue != null && valuation!.estimated_value == null

      await editValuationRequest(valuation!.id, {
        estimated_value: newEstimatedValue,
        condition: condition || null,
        evaluation_notes: evaluationNotes || null,
        visit_scheduled_at: visitScheduledAt
          ? new Date(visitScheduledAt).toISOString()
          : null,
        assigned_agent_id: assignedAgent || null,
        valued_by: valuedBy || null,
        valued_at:
          gettingValued || status === "completed"
            ? (valuation!.valued_at ?? new Date().toISOString())
            : valuation!.valued_at,
        list_out: listOut,
        status,
      })
      push({ title: "Valuation saved" })
    } catch (error) {
      push({ title: "Couldn't save", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    setSaving(true)
    try {
      await editValuationRequest(valuation!.id, { status: "cancelled" })
      setStatus("cancelled")
      push({ title: "Request closed" })
    } catch (error) {
      push({ title: "Couldn't close", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-neutral-100">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-neutral-100)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-5.5">
        <K className="cl-fig min-w-0 flex-1 truncate">
          Valuation · {valuation.location_label}
        </K>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Previous"
          disabled={!prev}
          onClick={() => prev && router.push(`/admin/valuations/${prev.id}`)}
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
          onClick={() => next && router.push(`/admin/valuations/${next.id}`)}
        >
          ↓
        </Button>
        <ButtonLink
          href="/admin/valuations"
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
              {lead?.full_name ?? "Owner unavailable"}
            </h2>
            <div className="cl-fig mt-1.5 text-[13.5px] text-neutral-700">
              {lead
                ? `${lead.phone}${lead.email ? ` · ${lead.email}` : ""}`
                : "No linked lead record"}
            </div>
          </div>
          <span className="flex-1" />
          <Status tone={STATUS_TONE[valuation.status]}>
            {STATUS_LABEL[valuation.status]}
          </Status>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            {lead ? (
              <>
                <ButtonLink
                  href={`tel:${lead.phone}`}
                  variant="primary"
                  className="flex-1"
                >
                  Call owner
                </ButtonLink>
                <ButtonLink href={waLink} variant="primary" className="flex-1">
                  WhatsApp
                </ButtonLink>
              </>
            ) : (
              <Button variant="secondary" className="flex-1" disabled>
                No contact on file
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={saving || valuation.status === "cancelled"}
            onClick={handleCancel}
          >
            Close request
          </Button>
        </div>

        <div className="mt-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) p-4">
          <K>What they wrote</K>
          <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.75] md:text-[14px]">
            {valuation.message || "Nothing written."}
          </p>
        </div>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>The property as described</SectionHead>
        <Pair label="Class">
          {titleCase(valuation.property_type)}
          {valuation.property_subtype
            ? ` · ${titleCase(valuation.property_subtype)}`
            : ""}
        </Pair>
        <Pair label="Address">{valuation.location_label}</Pair>
        <Pair label="Locality">
          {[valuation.neighbourhood, valuation.city, valuation.state_region]
            .filter(Boolean)
            .join(", ") || "—"}
        </Pair>
        {valuation.bedrooms != null ? (
          <Pair label="Bedrooms">{valuation.bedrooms}</Pair>
        ) : null}
        {valuation.bathrooms != null ? (
          <Pair label="Bathrooms">{valuation.bathrooms}</Pair>
        ) : null}
        {valuation.floor_area != null ? (
          <Pair label="Built area">
            {Number(valuation.floor_area).toLocaleString()}{" "}
            {valuation.floor_area_unit ?? ""}
          </Pair>
        ) : null}
        {valuation.land_area != null ? (
          <Pair label="Land area">
            {Number(valuation.land_area).toLocaleString()}{" "}
            {valuation.land_area_unit ?? ""}
          </Pair>
        ) : null}
        <Pair label="Owner's own figure">
          {valuation.owner_expectation != null
            ? formatMoney(
                Number(valuation.owner_expectation),
                valuation.currency_code
              )
            : "Not given"}
        </Pair>
        {lead ? (
          <Pair label="Visitor intent">{INTENT_LABEL[lead.intent]}</Pair>
        ) : null}
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Estimate · internal</SectionHead>
        <div className="mt-3 flex items-end gap-2">
          <label className="flex-1">
            <K>Estimated value ({valuation.currency_code})</K>
            <Input
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="cl-fig mt-1.5 text-[13px]"
              inputMode="decimal"
              placeholder="0"
            />
          </label>
          <label className="w-35 flex-none">
            <K>Condition</K>
            <Select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as PropertyCondition | "")
              }
              className="mt-1.5 text-[13px]"
            >
              <option value="">Not assessed</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <Pair label="Per unit implied">{perAreaLabel(valuation) ?? "—"}</Pair>
        <Pair label="Against owner's figure">
          <span className="text-(--color-accent-700)">
            {vsOwnerLabel(valuation) ?? "—"}
          </span>
        </Pair>
        <label className="mt-3 flex flex-col gap-1.5">
          <K>Evaluation notes</K>
          <Textarea
            value={evaluationNotes}
            onChange={(e) => setEvaluationNotes(e.target.value)}
            className="min-h-19.5 text-[13px]"
            placeholder="Site observations, tenancy terms, anything the report will need"
          />
        </label>
        <K className="mt-2">Internal only — never shown to the owner.</K>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Inspection</SectionHead>
        <div className="mt-3 flex gap-2">
          <Select
            value={assignedAgent}
            onChange={(e) => setAssignedAgent(e.target.value)}
            className="flex-1 text-[13px]"
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.user_id}>
                {a.display_name}
              </option>
            ))}
          </Select>
        </div>
        <label className="mt-2.5 flex flex-col gap-1.5">
          <K>Visit scheduled</K>
          <Input
            type="datetime-local"
            value={visitScheduledAt}
            onChange={(e) => setVisitScheduledAt(e.target.value)}
            className="cl-fig text-[13px]"
          />
        </label>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Outcome</SectionHead>
        <label className="mt-3 flex items-center gap-2.5 text-[13.5px]">
          <input
            type="checkbox"
            checked={listOut}
            onChange={(e) => setListOut(e.target.checked)}
          />
          Owner wants to instruct us to sell or let it
        </label>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1.5">
            <K>Valued by</K>
            <Select
              value={valuedBy}
              onChange={(e) => setValuedBy(e.target.value)}
              className="text-[13px]"
            >
              <option value="">Not recorded</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </label>
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
        </div>
        <Pair label="Valued at">
          {valuation.valued_at
            ? dateTimeLabel(valuation.valued_at)
            : "Not yet valued"}
        </Pair>
        <Pair label="Converted to a listing">
          {convertedListing ? (
            <Link href={`/admin/listings/${convertedListing.id}`}>
              {convertedListing.reference_code}
            </Link>
          ) : (
            "Not yet"
          )}
        </Pair>
      </div>

      <div className="px-4 pt-4.5 pb-7 md:px-5.5">
        <SectionHead>Activity</SectionHead>
        {activity.length === 0 ? (
          <div className="mt-3 text-[13px] text-neutral-600">
            No recorded activity for this request yet.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {activity.map((log) => (
              <div key={log.id} className="flex gap-3">
                <span className="cl-fig cl-k w-22 flex-none text-(--color-accent)">
                  {dateTimeLabel(log.created_at)}
                </span>
                <div className="text-[13px] leading-[1.55]">{log.action}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2.5">
          <span className="flex-1" />
          <Button
            type="button"
            variant="primary"
            className="flex-none"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
