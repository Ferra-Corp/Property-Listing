import * as React from "react"
import { cn } from "cn"

/** Applied-filter / specification chip. */
export function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span data-slot="chip" className={cn("cl-chip", className)} {...props} />
  )
}

/** Removable applied-filter chip. Pass onRemove to make it clickable. */
export function FilterChip({
  label,
  className,
  onRemove,
}: {
  label: string
  className?: string
  onRemove?: () => void
}) {
  if (!onRemove)
    return (
      <Chip className={className}>
        {label} <span className="text-neutral-600">×</span>
      </Chip>
    )

  return (
    <button type="button" onClick={onRemove} className="contents">
      <Chip className={className} data-slot="chip-button">
        {label} <span className="text-neutral-600">×</span>
      </Chip>
    </button>
  )
}

/**
 * A checkbox row in the refine rail: label left, count right. Uncontrolled
 * by default (defaultChecked); pass checked + onChange to drive it live.
 */
export function FilterCheck({
  label,
  count,
  defaultChecked,
  checked,
  onChange,
  accent,
  className,
}: {
  label: React.ReactNode
  count?: number
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
  /** the exclusive-mandates row, marked in lava */
  accent?: boolean
  className?: string
}) {
  return (
    <label className={cn("cl-fchk", className)}>
      <span className={accent ? "text-(--color-accent-2)" : undefined}>
        <input
          type="checkbox"
          {...(checked !== undefined
            ? { checked, onChange: (e) => onChange?.(e.target.checked) }
            : { defaultChecked })}
        />
        {label}
      </span>
      {count !== undefined ? (
        <span className="cl-fig cl-mono text-[11px] text-neutral-600">
          {count}
        </span>
      ) : null}
    </label>
  )
}

/** Small caps rule-under heading used inside the refine rail. */
export function FilterHeading({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "cl-k border-b border-(--color-divider) pb-1 text-neutral-600",
        className
      )}
    >
      {children}
    </div>
  )
}
