import type { ValuationRequest } from "../../_lib/Types/Valuation Request"
import { elapsedLabel } from "../../_lib/format"

export { STATUS_LABEL, STATUS_TONE } from "../viewings/_lib"

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

export function waitingLabel(createdAt: string): string {
  return elapsedLabel(Date.now() - new Date(createdAt).getTime())
}

/** What the estimate implies per unit of floor area — only meaningful when
 * both figures are actually on file. */
export function perAreaLabel(v: ValuationRequest): string | null {
  if (
    v.estimated_value == null ||
    v.floor_area == null ||
    Number(v.floor_area) === 0
  )
    return null
  const perUnit = Number(v.estimated_value) / Number(v.floor_area)
  return `${v.currency_code} ${perUnit.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${v.floor_area_unit ?? "unit"}`
}

/** How the internal estimate compares to what the owner was hoping for. */
export function vsOwnerLabel(v: ValuationRequest): string | null {
  if (
    v.estimated_value == null ||
    v.owner_expectation == null ||
    Number(v.owner_expectation) === 0
  )
    return null
  const pct =
    ((Number(v.estimated_value) - Number(v.owner_expectation)) /
      Number(v.owner_expectation)) *
    100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs their figure`
}
