import * as React from "react"
import { cn } from "cn"

export function Card({ className, ...props }: React.ComponentProps<"article">) {
  return <article data-slot="card" className={cn("cl-card", className)} {...props} />
}

export function CardKicker({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("cl-card-kicker", className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("cl-card-title", className)} {...props} />
}

export function CardBody({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("cl-card-body", className)} {...props} />
}

export function CardMeta({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("cl-card-meta", className)} {...props} />
}
