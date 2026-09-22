import type { StatusTone } from "../../_components/Admin/ui"
import type {
  Subscriber,
  SubscriberInterest,
} from "../../_lib/Types/Subscriber"

/** Mirrors `PROPERTY_KIND_OPTIONS` in app/page.tsx — the same grouping a
 * visitor picks from on the homepage's subscribe form. */
export const INTEREST_LABEL: Record<SubscriberInterest, string> = {
  go_down_warehouse: "Go-down / warehouse",
  office: "Office",
  retail_showroom: "Retail / showroom",
  yard_plot: "Yard / plot",
  residential: "Residential",
}

export const INTEREST_OPTIONS = Object.keys(
  INTEREST_LABEL
) as SubscriberInterest[]

export function isActive(subscriber: Subscriber): boolean {
  return !subscriber.unsubscribed_at
}

export const ACTIVE_TONE: StatusTone = "published"
export const UNSUBSCRIBED_TONE: StatusTone = "neutral"

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
