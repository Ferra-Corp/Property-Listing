import { cn } from "cn"

type Row = { quarter: string; older: number; refurb: number; fresh: number }

/**
 * The gap, drawn — a hairline bar pair per quarter, scaled to the highest
 * agreed rent in the period. Rasterised on export; it is CSS, not a chart lib.
 */
export function RateGapChart({ rows, max = 95 }: { rows: Row[]; max?: number }) {
  return (
    <>
      <div
        data-om-raster
        className="mb-2 rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-neutral-100)] p-3.5 md:p-[18px]"
      >
        <div className="flex flex-col gap-2.5 md:gap-3">
          {rows.map((row) => (
            <div key={row.quarter} className="flex items-center gap-2.5 md:gap-3">
              <div className="cl-k cl-fig w-[52px] flex-none text-[var(--color-neutral-600)] md:w-[88px]">
                {row.quarter}
              </div>
              <div className="flex flex-1 flex-col gap-[3px] md:gap-1">
                <Bar value={row.older} max={max} tone="light" />
                <Bar value={row.fresh} max={max} tone="dark" />
              </div>
              <div className="cl-fig w-[52px] flex-none text-right text-[11.5px] md:w-[78px] md:text-[12.5px]">
                {row.older} / {row.fresh}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3.5 border-t border-[var(--color-divider)] pt-2.5 md:mt-3.5 md:gap-[18px] md:pt-3">
          <Legend tone="light" label="Older stock" />
          <Legend tone="dark" label="New, dock-level" />
        </div>
      </div>
      <div className="cl-k mb-5 text-[var(--color-neutral-600)]">
        Bars scaled to KES {max}, the highest agreed rent in the period
      </div>
    </>
  )
}

function Bar({ value, max, tone }: { value: number; max: number; tone: "light" | "dark" }) {
  return (
    <div
      className={cn(
        "h-[9px] md:h-[11px]",
        tone === "light" ? "bg-[var(--color-accent-300)]" : "bg-[var(--color-accent-600)]",
      )}
      style={{ width: `${Math.round((value / max) * 100)}%` }}
    />
  )
}

function Legend({ tone, label }: { tone: "light" | "dark"; label: string }) {
  return (
    <div className="flex items-center gap-1.5 md:gap-[7px]">
      <span
        className={cn(
          "h-2 w-3.5 md:h-[9px] md:w-4",
          tone === "light" ? "bg-[var(--color-accent-300)]" : "bg-[var(--color-accent-600)]",
        )}
      />
      <span className="cl-k text-[var(--color-neutral-700)]">{label}</span>
    </div>
  )
}
