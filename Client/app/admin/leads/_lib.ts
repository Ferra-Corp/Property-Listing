import type { Lead, LeadIntent, LeadSource, LeadStatus } from "../../_lib/Types/Lead"
import type { SiteSetting } from "../../_lib/Types/Site Setting"
import type { StatusTone } from "../../_components/Admin/ui"
import { elapsedLabel, formatMoney } from "../../_lib/format"

export const SOURCE_LABEL: Record<LeadSource, string> = {
  contact_form: "Contact form",
  listing_enquiry: "Listing enquiry",
  valuation_form: "Valuation form",
  viewing_form: "Viewing form",
  whatsapp: "WhatsApp",
  phone: "Phone",
  email: "Email",
  referral: "Referral",
  other: "Other",
}

export const INTENT_LABEL: Record<LeadIntent, string> = {
  buy: "Buying",
  rent: "Renting",
  lease: "Leasing",
  sell: "Selling",
  valuation: "Wants a valuation",
  general: "General enquiry",
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  viewing_booked: "Viewing booked",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
}

export const STATUS_TONE: Record<LeadStatus, StatusTone> = {
  new: "pending",
  contacted: "mark",
  qualified: "published",
  viewing_booked: "published",
  negotiating: "published",
  won: "published",
  lost: "neutral",
  spam: "outline",
}

/** The queue's five buckets are broader than the real pipeline — there's
 * no single "closed" status, just three terminal ones. */
export type QueueFilter = "New" | "Contacted" | "Open" | "Closed" | "All"

export function inQueueFilter(status: LeadStatus, filter: QueueFilter): boolean {
  if (filter === "All") return true
  if (filter === "New") return status === "new"
  if (filter === "Contacted") return status === "contacted"
  if (filter === "Open")
    return ["qualified", "viewing_booked", "negotiating"].includes(status)
  return ["won", "lost", "spam"].includes(status)
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function dateTimeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** How long a lead has been waiting for a first reply — real elapsed time
 * since it landed, up to the moment it was first contacted (if it has been).
 * The SLA threshold is read from the real `leads.reply_sla_*` site settings,
 * treated as calendar time rather than true business hours. */
export function waitingFor(
  lead: Lead,
  settings: SiteSetting[]
): { label: string; overdue: boolean; slaLabel: string | null } {
  const endpoint = lead.first_contacted_at
    ? new Date(lead.first_contacted_at).getTime()
    : Date.now()
  const elapsedMs = endpoint - new Date(lead.created_at).getTime()

  const slaValueRaw = settings.find((s) => s.key === "leads.reply_sla_value")?.value?.value,
    slaUnitRaw = settings.find((s) => s.key === "leads.reply_sla_unit")?.value?.value

  const slaValue = slaValueRaw != null ? Number(slaValueRaw) : null,
    slaUnit = typeof slaUnitRaw === "string" ? slaUnitRaw : null

  let slaMs: number | null = null
  if (slaValue != null && !Number.isNaN(slaValue)) {
    if (slaUnit?.includes("day")) slaMs = slaValue * 86_400_000
    else slaMs = slaValue * 3_600_000 // default/"working hours" — treated as plain hours
  }

  const overdue = !lead.first_contacted_at && slaMs != null && elapsedMs > slaMs

  return {
    label: lead.first_contacted_at ? "Replied" : elapsedLabel(elapsedMs),
    overdue,
    slaLabel: slaValue != null && slaUnit ? `SLA ${slaValue} ${slaUnit}` : null,
  }
}

export function budgetLabel(lead: Lead): string | null {
  if (lead.budget_min == null && lead.budget_max == null) return null
  if (lead.budget_min != null && lead.budget_max != null)
    return `${formatMoney(lead.budget_min, lead.currency_code)} – ${formatMoney(lead.budget_max, lead.currency_code)}`
  if (lead.budget_min != null) return `From ${formatMoney(lead.budget_min, lead.currency_code)}`
  return `Up to ${formatMoney(lead.budget_max!, lead.currency_code)}`
}
