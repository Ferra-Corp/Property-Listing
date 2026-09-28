"use client"

import * as React from "react"
import { getHapticsEnabled, setHapticsEnabled, haptic } from "@/lib/haptics"
import { cn } from "cn"

/**
 * Small on/off switch for haptic feedback. Renders as a labelled pill
 * that flips localStorage['dg:haptics'] and reflects the current state.
 * Client-only; hydration-safe via a mounted flag.
 */
export function HapticsToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false)
  const [on, setOn] = React.useState(true)

  React.useEffect(() => {
    setMounted(true)
    setOn(getHapticsEnabled())
  }, [])

  if (!mounted) {
    // avoid FOUC — render a placeholder of the same size so nothing shifts
    return (
      <div
        className={cn("h-8 w-40 rounded-full", className)}
        aria-hidden="true"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        const next = !on
        setHapticsEnabled(next)
        setOn(next)
        if (next) haptic("selection")
      }}
      className={cn(
        "flex h-11 md:h-8 items-center justify-between gap-3 rounded-full border border-(--color-divider) px-3 text-[13px] text-(--color-text) transition-colors",
        on ? "bg-(--color-bg)" : "bg-neutral-100",
        className
      )}
      aria-pressed={on}
      aria-label={on ? "Haptic feedback on" : "Haptic feedback off"}
    >
      <span>Haptic feedback</span>
      <span
        className={cn(
          "relative inline-flex h-4 w-7 rounded-full transition-colors",
          on ? "bg-(--color-accent)" : "bg-neutral-400"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-150 ease-out",
            on ? "translate-x-3.5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  )
}
