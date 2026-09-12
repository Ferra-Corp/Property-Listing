import * as React from "react"
import { cn } from "cn"

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn("cl-input", className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("cl-input", className)} {...props} />
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn("cl-input", className)} {...props} />
}

export function Field({
  label,
  className,
  children,
}: {
  label?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("cl-field", className)}>
      {label ? <label>{label}</label> : null}
      {children}
    </div>
  )
}

/** Hairline-bordered radio, the system's .radio + .dot pair. */
export function Radio({
  label,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: React.ReactNode }) {
  return (
    <label className={cn("cl-radio", className)}>
      <input type="radio" {...props} />
      <span className="cl-dot" />
      {label}
    </label>
  )
}

/**
 * Segmented control — native radios, no script. Uncontrolled by default;
 * pass value + onChange to drive it from a client component.
 */
export function Segmented({
  name,
  options,
  defaultValue,
  value,
  onChange,
  className,
  optionClassName,
  fill,
}: {
  name: string
  options: string[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  optionClassName?: string
  /** stretch options to fill the row (mobile) */
  fill?: boolean
}) {
  return (
    <div className={cn("cl-seg", className)}>
      {options.map((option) => (
        <label
          key={option}
          className={cn("cl-seg-opt", fill && "flex-1 justify-center", optionClassName)}
        >
          <input
            type="radio"
            name={name}
            value={option}
            {...(value !== undefined
              ? { checked: value === option, onChange: () => onChange?.(option) }
              : { defaultChecked: (defaultValue ?? options[0]) === option })}
          />
          {option}
        </label>
      ))}
    </div>
  )
}
