import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

export const tagVariants = cva("cl-tag", {
  variants: {
    variant: {
      accent: "cl-tag-accent",
      accent2: "cl-tag-accent-2",
      neutral: "cl-tag-neutral",
      outline: "cl-tag-outline",
      /** the exclusive mark — the one place molten lava appears */
      mark: "cl-tag-mark",
    },
  },
  defaultVariants: { variant: "neutral" },
})

export function Tag({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof tagVariants>) {
  return <span data-slot="tag" className={cn(tagVariants({ variant }), className)} {...props} />
}
