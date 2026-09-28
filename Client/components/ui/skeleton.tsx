import { cn } from "cn"

/**
 * Fixed-size shimmer placeholder. Reserves exact box dimensions so nothing
 * shifts when real content lands. Prefers-reduced-motion is honoured via
 * the global animation-duration clamp in globals.css.
 */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("cl-skeleton", className)}
      {...props}
    />
  )
}
