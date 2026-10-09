import type { Testimonial } from "../../_lib/Types/Testimonial"
import type { StatusTone } from "../../_components/Admin/ui"

export function statusTone(testimonial: Testimonial): StatusTone {
  return testimonial.is_active ? "published" : "outline"
}

export function statusLabel(testimonial: Testimonial): string {
  return testimonial.is_active ? "Shown" : "Held back"
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
