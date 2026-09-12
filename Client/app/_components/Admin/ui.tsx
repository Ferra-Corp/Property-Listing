import * as React from "react"
import { cn } from "cn"

/** Small caps mono label — the system's kicker, at admin scale. */
export function K({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("cl-k text-[var(--color-neutral-600)]", className)} {...props} />
}

/** A figure: tabular, mono where it is a code rather than a quantity. */
export function Fig({
  mono,
  className,
  ...props
}: React.ComponentProps<"span"> & { mono?: boolean }) {
  return (
    <span className={cn("cl-fig", mono && "cl-mono text-[11.5px]", className)} {...props} />
  )
}

export type StatusTone = "published" | "pending" | "neutral" | "outline" | "mark"

const STATUS_TONES: Record<StatusTone, string> = {
  published: "bg-[var(--color-accent-100)] text-[var(--color-accent-800)]",
  pending: "bg-[var(--color-accent-2-100)] text-[var(--color-accent-2-700)]",
  neutral: "bg-[var(--color-neutral-300)] text-[var(--color-neutral-800)]",
  outline: "border border-[var(--color-divider)] text-[var(--color-neutral-700)]",
  mark: "border border-[var(--color-accent-2)] text-[var(--color-accent-2)]",
}

/** The workflow state pill — mono, small caps, never a heavy fill. */
export function Status({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: StatusTone }) {
  return (
    <span
      className={cn(
        "cl-mono inline-flex items-center gap-[5px] rounded-[3px] px-2 py-[3px] text-[10px] tracking-[0.1em] whitespace-nowrap uppercase",
        STATUS_TONES[tone],
        className,
      )}
      {...props}
    />
  )
}

/** A round filter chip — the phone's stand-in for the segmented control. */
export function Chip({
  on,
  className,
  ...props
}: React.ComponentProps<"span"> & { on?: boolean }) {
  return (
    <span
      className={cn(
        "cl-mono inline-flex items-center rounded-full border border-[var(--color-divider)] px-3 py-1.5 text-[10px] tracking-[0.12em] whitespace-nowrap text-[var(--color-neutral-700)] uppercase",
        on &&
          "border-[var(--color-accent)] bg-[var(--color-accent-100)] text-[var(--color-accent-800)]",
        className,
      )}
      {...props}
    />
  )
}

/**
 * The attention band — lava-edged when something is waiting on the admin,
 * gold-edged when it is only a standing note.
 */
export function Banner({
  kicker,
  action,
  tone = "warn",
  children,
}: {
  kicker: React.ReactNode
  action?: React.ReactNode
  tone?: "warn" | "quiet"
  children: React.ReactNode
}) {
  const warn = tone === "warn"
  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 rounded-[var(--cl-radius-lg)] border border-l-[3px] px-4 py-4 md:flex-row md:items-center md:gap-[18px] md:px-[18px]",
        warn
          ? "border-[var(--color-accent-2-300)] border-l-[var(--color-accent-2)] bg-[var(--color-accent-2-100)]"
          : "border-[var(--color-accent-300)] border-l-[var(--color-accent)] bg-[var(--color-accent-100)]",
      )}
    >
      <div className="flex-1">
        <div
          className={cn(
            "cl-k",
            warn ? "text-[var(--color-accent-2-700)]" : "text-[var(--color-accent-800)]",
          )}
        >
          {kicker}
        </div>
        <div className="mt-[7px] text-[13.5px] leading-[1.5] md:text-[14.5px]">{children}</div>
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  )
}

/** Table head cell — small caps over the heavy rule. */
export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "cl-mono border-b-2 border-[var(--color-text)] pt-0 pr-3 pb-2.5 pl-0 text-left text-[9.5px] tracking-[0.14em] whitespace-nowrap text-[var(--color-neutral-600)] uppercase",
        className,
      )}
      {...props}
    />
  )
}

/** Table body cell. */
export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-[var(--color-divider)] py-3.5 pr-3 pl-0 align-top text-[13.5px]",
        className,
      )}
      {...props}
    />
  )
}

/** A hoverable table row. */
export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("[&:hover_td]:bg-[var(--color-neutral-100)]", className)} {...props} />
}

/** The heavy-ruled section heading used inside sheets and phone sections. */
export function SectionHead({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "cl-mono border-b-2 border-[var(--color-text)] pb-1.5 text-[9.5px] leading-[1.4] tracking-[0.16em] text-[var(--color-neutral-600)] uppercase",
        className,
      )}
      {...props}
    />
  )
}

/** Label left, figure right, hairline under. */
export function Pair({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("cl-pair text-[13px]", className)}>
      <span className="text-[var(--color-neutral-700)]">{label}</span>
      <span className="cl-fig text-right">{children}</span>
    </div>
  )
}

/** A checklist line — what must be true before a thing may publish. */
export function CheckLine({
  children,
  className,
  ...props
}: React.ComponentProps<"input"> & { children: React.ReactNode }) {
  return (
    <label
      className={cn("flex items-start gap-[9px] py-2 text-[13px] leading-[1.5]", className)}
    >
      <input
        type="checkbox"
        className="mt-[3px] accent-[var(--color-accent)] disabled:opacity-45"
        {...props}
      />
      <span>{children}</span>
    </label>
  )
}

/** A dated line in an activity column. */
export function ActivityLine({
  date,
  children,
}: {
  date: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="cl-k cl-fig w-16 flex-none text-[var(--color-accent)]">{date}</span>
      <div className="text-[13px] leading-[1.55]">{children}</div>
    </div>
  )
}

/** The three standing notes that close most desk pages. */
export function Notes({ items }: { items: { label: string; body: React.ReactNode }[] }) {
  return (
    <div className="grid gap-7 border-t border-[var(--color-divider)] pt-4 md:grid-cols-3">
      {items.map((note) => (
        <div key={note.label}>
          <K>{note.label}</K>
          <p className="mt-2 mb-0 text-[12.5px] leading-[1.65] text-[var(--color-neutral-700)]">
            {note.body}
          </p>
        </div>
      ))}
    </div>
  )
}
