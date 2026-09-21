import type { RequestStatus } from "../../_lib/Types/Viewing Request"
import type { StatusTone } from "../../_components/Admin/ui"
import { elapsedLabel } from "../../_lib/format"

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
}

export const STATUS_TONE: Record<RequestStatus, StatusTone> = {
  pending: "pending",
  confirmed: "published",
  completed: "outline",
  cancelled: "neutral",
  no_show: "mark",
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

/** How long a request has sat waiting for a decision — real elapsed time
 * since it landed, only meaningful while still pending. */
export function waitingLabel(createdAt: string): string {
  return elapsedLabel(Date.now() - new Date(createdAt).getTime())
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr),
    now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}
