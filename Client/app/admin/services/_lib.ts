import type { Service } from "../../_lib/Types/Service"
import type { StatusTone } from "../../_components/Admin/ui"

export function statusTone(service: Service): StatusTone {
  return service.is_active ? "published" : "outline"
}

export function statusLabel(service: Service): string {
  return service.is_active ? "Shown" : "Held back"
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Ordered by `sort_order`, the register's real display order on the
 * public services page. */
export function bySortOrder(services: Service[]): Service[] {
  return [...services].sort((a, b) => a.sort_order - b.sort_order)
}
