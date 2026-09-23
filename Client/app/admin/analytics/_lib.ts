import type { Lead, LeadSource } from "../../_lib/Types/Lead"
import type { ViewingRequest } from "../../_lib/Types/Viewing Request"
import type { ValuationRequest } from "../../_lib/Types/Valuation Request"
import type { ListingWithThumbnail } from "../../_lib/Types/Listing"
import { SOURCE_LABEL } from "../leads/_lib"

export type Period = "30d" | "month" | "quarter" | "all"

export const PERIOD_LABEL: Record<Period, string> = {
  "30d": "Last 30 days",
  month: "This month",
  quarter: "This quarter",
  all: "All time",
}

export function periodRange(
  period: Period,
  now: Date = new Date()
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = now
  let start: Date, prevStart: Date, prevEnd: Date

  if (period === "30d") {
    start = new Date(end)
    start.setDate(start.getDate() - 30)
    prevEnd = new Date(start)
    prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - 30)
  } else if (period === "month") {
    start = new Date(end.getFullYear(), end.getMonth(), 1)
    prevEnd = new Date(start)
    prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
  } else if (period === "quarter") {
    const q = Math.floor(end.getMonth() / 3)
    start = new Date(end.getFullYear(), q * 3, 1)
    prevEnd = new Date(start)
    prevStart = new Date(start.getFullYear(), start.getMonth() - 3, 1)
  } else {
    start = new Date(0)
    prevStart = new Date(0)
    prevEnd = new Date(0)
  }

  return { start, end, prevStart, prevEnd }
}

export function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t <= end.getTime()
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b),
    mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

export function minutesLabel(minutes: number | null): string {
  if (minutes == null) return "—"
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60),
    rest = Math.round(minutes % 60)
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

export function daysLabel(days: number | null): string {
  if (days == null) return "—"
  return `${days.toFixed(1)} days`
}

export function pctDelta(
  current: number,
  previous: number
): { label: string; up: boolean } | null {
  if (previous === 0) return current === 0 ? null : { label: "New", up: true }
  const pct = ((current - previous) / previous) * 100
  return {
    label: `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`,
    up: pct >= 0,
  }
}

/** Minutes from an enquiry landing to the first recorded contact. */
export function firstReplyMinutes(lead: Lead): number | null {
  if (!lead.first_contacted_at) return null
  return (
    (new Date(lead.first_contacted_at).getTime() -
      new Date(lead.created_at).getTime()) /
    60_000
  )
}

export function sourceBreakdown(
  leads: Lead[]
): { source: LeadSource; label: string; count: number; pct: number }[] {
  const total = leads.length,
    counts = new Map<LeadSource, number>()

  for (const l of leads) counts.set(l.source, (counts.get(l.source) ?? 0) + 1)

  return Array.from(counts.entries())
    .map(([source, count]) => ({
      source,
      label: SOURCE_LABEL[source],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

/** Leads created per day across [start, end] — clamped to a sane window
 * even under "all time" so the chart never has to draw thousands of days. */
export function dailyCounts(
  leads: Lead[],
  period: Period,
  start: Date,
  end: Date
): { date: string; count: number }[] {
  let effectiveStart = start

  if (period === "all") {
    if (leads.length === 0) {
      effectiveStart = new Date(end)
      effectiveStart.setDate(effectiveStart.getDate() - 30)
    } else {
      const earliest = leads.reduce(
        (min, l) => Math.min(min, new Date(l.created_at).getTime()),
        Infinity
      )
      effectiveStart = new Date(earliest)
    }
  }

  // `created_at` is a UTC ISO string, so the day boundaries here are built
  // in UTC too — mixing in local-time midnight (via setHours/toISOString)
  // would shift every bucket by the viewer's UTC offset.
  const cursor = new Date(
      Date.UTC(
        effectiveStart.getUTCFullYear(),
        effectiveStart.getUTCMonth(),
        effectiveStart.getUTCDate()
      )
    ),
    endDay = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
    )

  const days: { date: string; count: number }[] = []
  while (cursor <= endDay) {
    const dayKey = cursor.toISOString().slice(0, 10),
      count = leads.filter((l) => l.created_at.slice(0, 10) === dayKey).length

    days.push({
      date: cursor.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      count,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

export type FunnelStage = { label: string; value: number }

/** Reads the pipeline straight from what's on file: a lead only counts at a
 * stage once something real backs it — a recorded first contact, a linked
 * viewing request, that viewing marked complete, or the lead itself marked
 * won. `viewings` should be the FULL set (not period-filtered) so a lead's
 * later history still counts even if it falls outside the selected window. */
export function funnelStages(
  leads: Lead[],
  viewings: ViewingRequest[]
): FunnelStage[] {
  const leadIdsWithViewing = new Set(viewings.map((v) => v.lead_id)),
    completedLeadIds = new Set(
      viewings.filter((v) => v.status === "completed").map((v) => v.lead_id)
    )

  return [
    { label: "Enquiries taken", value: leads.length },
    {
      label: "Contacted",
      value: leads.filter((l) => l.first_contacted_at).length,
    },
    {
      label: "Viewing booked",
      value: leads.filter((l) => leadIdsWithViewing.has(l.id)).length,
    },
    {
      label: "Viewing held",
      value: leads.filter((l) => completedLeadIds.has(l.id)).length,
    },
    { label: "Won", value: leads.filter((l) => l.status === "won").length },
  ]
}

export function mostRequestedTimeSlot(viewings: ViewingRequest[]): string {
  const counts = new Map<string, number>()
  for (const v of viewings) {
    if (!v.preferred_time_slot) continue
    counts.set(
      v.preferred_time_slot,
      (counts.get(v.preferred_time_slot) ?? 0) + 1
    )
  }
  if (counts.size === 0) return "—"
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export function valuationStats(valuations: ValuationRequest[]) {
  const total = valuations.length,
    completed = valuations.filter((v) => v.status === "completed").length,
    daysToReport = median(
      valuations
        .filter((v) => v.valued_at)
        .map(
          (v) =>
            (new Date(v.valued_at!).getTime() -
              new Date(v.created_at).getTime()) /
            86_400_000
        )
    ),
    converted = valuations.filter((v) => v.converted_listing_id).length

  return { total, completed, daysToReport, converted }
}

export type CityRow = {
  city: string
  listings: number
  enquiries: number
  viewings: number
  held: number
  won: number
  replyMedianMinutes: number | null
}

/** Grouped by the one place-field that's actually populated on this data —
 * a listing's city — joined to leads/viewings via `listing_id`. A lead
 * whose own `city` was captured directly (but which never named a
 * particular listing) is counted there too. */
export function byCity(
  listings: ListingWithThumbnail[],
  leads: Lead[],
  viewings: ViewingRequest[]
): CityRow[] {
  const cities = Array.from(
    new Set(listings.map((l) => l.city).filter((c): c is string => !!c))
  )

  return cities
    .map((city) => {
      const cityListingIds = new Set(
          listings.filter((l) => l.city === city).map((l) => l.id)
        ),
        cityLeads = leads.filter(
          (l) =>
            (l.listing_id && cityListingIds.has(l.listing_id)) ||
            l.city === city
        ),
        cityViewings = viewings.filter((v) => cityListingIds.has(v.listing_id)),
        held = cityViewings.filter((v) => v.status === "completed").length,
        won = cityLeads.filter((l) => l.status === "won").length,
        replyTimes = cityLeads
          .map(firstReplyMinutes)
          .filter((m): m is number => m != null)

      return {
        city,
        listings: cityListingIds.size,
        enquiries: cityLeads.length,
        viewings: cityViewings.length,
        held,
        won,
        replyMedianMinutes: median(replyTimes),
      }
    })
    .sort((a, b) => b.enquiries - a.enquiries)
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as Record<string, string>
      )[c]!
  )
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export type AnalyticsSummaryInput = {
  period: Period
  cityFilter: string
  start: Date
  end: Date
  prevStart: Date
  prevEnd: Date
  kpis: { label: string; figure: string; note: string }[]
  sources: { label: string; count: number; pct: number }[]
  funnel: FunnelStage[]
  valStats: {
    total: number
    completed: number
    daysToReport: number | null
    converted: number
  }
  timeSlot: string
  cityRows: CityRow[]
}

/** What "Export" used to do — dump the raw lead rows — had nothing to do
 * with the page it sat on. This instead writes up the same figures the
 * page itself shows (KPIs, sources, funnel, valuations, city table) into a
 * printable summary, titled and dated, and hands it to the browser's own
 * print dialog — "Save as PDF" there is the export. No client-side
 * download here needs a library: the title on the printed/saved document
 * comes from this window's own <title>. */
export function exportAnalyticsSummary(input: AnalyticsSummaryInput): void {
  const generatedOn = fmtDate(new Date()),
    title = `D&G Realtors : Analytics - ${generatedOn}`,
    rangeLabel =
      input.period === "all"
        ? "Everything on file"
        : `${fmtDate(input.start)} – ${fmtDate(input.end)} (previous period: ${fmtDate(input.prevStart)} – ${fmtDate(input.prevEnd)})`

  const win = window.open("", "_blank", "width=900,height=1000")
  if (!win) return // popup blocked — nothing to fall back to silently

  const kpiRows = input.kpis
      .map(
        (k) =>
          `<tr><td>${escapeHtml(k.label)}</td><td class="num">${escapeHtml(k.figure)}</td><td class="note">${escapeHtml(k.note)}</td></tr>`
      )
      .join(""),
    sourceRows = input.sources
      .map(
        (s) =>
          `<tr><td>${escapeHtml(s.label)}</td><td class="num">${s.count}</td><td class="num">${s.pct}%</td></tr>`
      )
      .join(""),
    funnelRows = input.funnel
      .map(
        (f) =>
          `<tr><td>${escapeHtml(f.label)}</td><td class="num">${f.value}</td></tr>`
      )
      .join(""),
    cityTableRows = input.cityRows
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.city)}</td><td class="num">${c.listings}</td><td class="num">${c.enquiries}</td><td class="num">${c.viewings > 0 ? `${c.held}/${c.viewings}` : "—"}</td><td class="num">${c.won}</td><td class="num">${minutesLabel(c.replyMedianMinutes)}</td></tr>`
      )
      .join("")

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; color: #2b2118; margin: 44px; background: #fff; }
  h1 { font-size: 21px; font-weight: normal; margin: 0 0 4px; }
  .meta { font-family: ui-monospace, "SFMono-Regular", monospace; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #7c7365; margin-bottom: 30px; }
  h2 { font-size: 13px; font-weight: normal; text-transform: uppercase; letter-spacing: .08em; color: #7c7365; border-bottom: 1px solid #ded7c4; padding-bottom: 6px; margin: 30px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td, th { padding: 6px 4px; border-bottom: 1px solid #efeada; text-align: left; vertical-align: top; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.note { color: #7c7365; font-size: 12px; }
  .footer { margin-top: 40px; font-size: 11px; color: #9e9585; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
  <h1>D&amp;G Realtors &mdash; Analytics summary</h1>
  <div class="meta">${escapeHtml(rangeLabel)}${input.cityFilter ? ` &middot; ${escapeHtml(input.cityFilter)} only` : ""}</div>

  <h2>Headline figures</h2>
  <table>${kpiRows}</table>

  <h2>Where enquiries came from</h2>
  <table>${sourceRows || `<tr><td>No enquiries in this period.</td></tr>`}</table>

  <h2>What the register did</h2>
  <table>${funnelRows}</table>

  <h2>Valuations &amp; the diary</h2>
  <table>
    <tr><td>Requests</td><td class="num">${input.valStats.total}</td></tr>
    <tr><td>Reports issued</td><td class="num">${input.valStats.completed}</td></tr>
    <tr><td>Days to report</td><td class="num">${daysLabel(input.valStats.daysToReport)}</td></tr>
    <tr><td>Converted to a listing</td><td class="num">${input.valStats.total > 0 ? `${input.valStats.converted} of ${input.valStats.total}` : "—"}</td></tr>
    <tr><td>Most requested time</td><td class="num" style="text-transform:capitalize">${escapeHtml(input.timeSlot)}</td></tr>
  </table>

  <h2>By city</h2>
  <table>
    <tr><th>City</th><th class="num">Listings</th><th class="num">Enquiries</th><th class="num">Viewings</th><th class="num">Won</th><th class="num">First reply</th></tr>
    ${cityTableRows || `<tr><td colspan="6">No listings have a city on file yet.</td></tr>`}
  </table>

  <div class="footer">Generated ${escapeHtml(generatedOn)} &middot; D&amp;G Realtors admin desk</div>

  <script>window.onload = function () { setTimeout(function () { window.print(); }, 200); };</script>
</body>
</html>`)
  win.document.close()
}
