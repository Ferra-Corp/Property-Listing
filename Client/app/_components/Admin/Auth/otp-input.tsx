"use client"

import * as React from "react"
import { cn } from "cn"

/** Six boxes, one figure each, advancing as they are filled. */
export function OtpInput({
  name = "code",
  length = 6,
  defaultValue = "",
  className,
  onChange,
}: {
  name?: string
  length?: number
  defaultValue?: string
  className?: string
  /** Fires with the combined code every time a digit changes. */
  onChange?: (code: string) => void
}) {
  const [digits, setDigits] = React.useState(() =>
    Array.from({ length }, (_, index) => defaultValue[index] ?? "")
  )
  const refs = React.useRef<(HTMLInputElement | null)[]>([])

  function set(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    setDigits((current) => {
      const next = current.map((d, i) => (i === index ? digit : d))
      onChange?.(next.join(""))
      return next
    })
    if (digit && index < length - 1) refs.current[index + 1]?.focus()
  }

  return (
    <div className={cn("mt-4 grid grid-cols-6 gap-1.75 md:gap-2.5", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          name={`${name}-${index + 1}`}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Figure ${index + 1}`}
          onChange={(event) => set(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus()
            }
          }}
          className="cl-input cl-fig cl-mono px-0 py-2.75 text-center text-[19px] md:py-3 md:text-[22px]"
        />
      ))}
    </div>
  )
}
