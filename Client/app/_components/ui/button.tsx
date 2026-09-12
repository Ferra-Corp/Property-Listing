import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Classical button — an outline, never a fill.
 * Variants map 1:1 to the design system's .btn-* classes.
 */
export const buttonVariants = cva("cl-btn", {
  variants: {
    variant: {
      primary: "cl-btn-primary",
      secondary: "cl-btn-secondary",
      ghost: "cl-btn-ghost",
      bare: "",
    },
    size: {
      default: "",
      icon: "cl-btn-icon",
      sm: "px-2.5 py-1.5 text-[13px]",
    },
    block: { true: "cl-btn-block", false: "" },
  },
  defaultVariants: { variant: "secondary", size: "default", block: false },
})

type Variants = VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  block,
  ...props
}: React.ComponentProps<"button"> & Variants) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  )
}

export function ButtonLink({
  className,
  variant,
  size,
  block,
  href,
  ...props
}: React.ComponentProps<typeof Link> & Variants) {
  return (
    <Link
      data-slot="button"
      href={href}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  )
}
