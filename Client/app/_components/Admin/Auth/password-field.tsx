"use client"

import * as React from "react"
import { cn } from "cn"
import { Button } from "../../ui/button"
import { Input } from "../../ui/field"

/** Password field with the reveal button beside it. Design only — no validation. */
export function PasswordField({
  label,
  name,
  reveal = true,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: string; reveal?: boolean }) {
  const [shown, setShown] = React.useState(false)
  return (
    <label className={cn("mt-4 flex flex-col gap-2", className)}>
      <span className="cl-k text-neutral-600">{label}</span>
      {reveal ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-2">
          <Input
            type={shown ? "text" : "password"}
            name={name}
            className="min-h-11.5 text-[15px] md:min-h-9 md:text-[14.5px]"
            {...props}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShown((value) => !value)}
            className="min-h-11.5 whitespace-nowrap md:min-h-9"
          >
            {shown ? "Hide" : "Show"}
          </Button>
        </div>
      ) : (
        <Input
          type="password"
          name={name}
          className="min-h-11.5 text-[15px] md:min-h-9 md:text-[14.5px]"
          {...props}
        />
      )}
    </label>
  )
}

/** The strength bar and its one-line reading. */
export function Strength({
  pct,
  note,
  weak,
}: {
  pct: number
  note: string
  weak?: boolean
}) {
  return (
    <>
      <div className="mt-2.5 h-1.25 overflow-hidden rounded-[3px] bg-neutral-300">
        <i
          className={cn(
            "block h-full",
            weak ? "bg-(--color-accent-400)" : "bg-(--color-accent)"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="cl-k mt-1.75 text-neutral-600">{note}</div>
    </>
  )
}

/** What is asked of the password — a live checklist, disabled as a read-out. */
export function RuleList({
  rules,
}: {
  rules: { text: string; met: boolean }[]
}) {
  return (
    <div className="mt-4 rounded-(--cl-radius-md) border border-(--color-divider) bg-neutral-100 px-3.75 py-3.5">
      <div className="cl-k text-neutral-700">What is asked of it</div>
      {rules.map((rule) => (
        <label
          key={rule.text}
          className="mt-2.5 flex items-start gap-2.5 text-[13px] leading-normal"
        >
          <input
            type="checkbox"
            checked={rule.met}
            disabled
            readOnly
            className="mt-0.5 accent-(--color-accent) disabled:opacity-45"
          />
          <span>{rule.text}</span>
        </label>
      ))}
    </div>
  )
}
