import * as React from "react"
import Image, { type StaticImageData } from "next/image"
import { cn } from "cn"

/**
 * Every photograph on the site is matted as a plate. Pass `src` once real
 * photography is on file — the placeholder hatch (or children) stands in
 * until then.
 */
export function Plate({
  label,
  className,
  matted = true,
  children,
  src,
  alt,
  sizes,
  priority,
  ...props
}: React.ComponentProps<"div"> & {
  /** placeholder caption, e.g. "Plate 01 — Go-down, Eastern Bypass" */
  label?: React.ReactNode
  /** the 6px surface mat + hairline outline; off for edge-to-edge card images */
  matted?: boolean
  /** a real photo — renders in place of the hatch/children when given */
  src?: string | StaticImageData | null
  alt?: string
  /** override the next/image sizes hint for callers with tighter contexts */
  sizes?: string
  /** LCP hero images should pass priority to skip lazy loading */
  priority?: boolean
}) {
  return (
    <div
      data-slot="plate"
      className={cn(
        "cl-plate relative overflow-hidden",
        !src && "cl-ph",
        !matted && "border-0",
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? (typeof label === "string" ? label : "")}
          fill
          sizes={sizes ?? "(min-width: 768px) 50vw, 100vw"}
          priority={priority}
          className="object-cover"
        />
      ) : (
        (children ?? <span>{label}</span>)
      )}
    </div>
  )
}
