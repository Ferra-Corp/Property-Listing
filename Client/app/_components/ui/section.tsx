import * as React from "react"
import Link from "next/link"
import { cn } from "cn"

/** Flush-left heading over the heavy rule that opens every section. */
export function SectionHead({
  title,
  aside,
  href,
  linkLabel,
  className,
}: {
  title: React.ReactNode
  /** a plain kicker on the right */
  aside?: React.ReactNode
  /** or a link on the right */
  href?: string
  linkLabel?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("cl-sechead", className)}>
      <h3 className="text-[20px] md:text-[25px]">{title}</h3>
      {href ? (
        <Link href={href} className="shrink-0 text-[12.5px] md:text-[13px]">
          {linkLabel} →
        </Link>
      ) : aside ? (
        <span className="cl-k shrink-0 text-neutral-600">{aside}</span>
      ) : null}
    </div>
  )
}

/** Hairline-ruled index row: label on the left, tabular figure on the right. */
export function IndexRow({
  href,
  label,
  figure,
  className,
}: {
  href?: string
  label: React.ReactNode
  figure?: React.ReactNode
  className?: string
}) {
  const body = (
    <>
      <span>{label}</span>
      {figure !== undefined ? (
        <span className="cl-fig cl-mono text-[11.5px] text-neutral-600">
          {figure}
        </span>
      ) : null}
    </>
  )
  return href ? (
    <Link href={href} className={cn("cl-midx", className)}>
      {body}
    </Link>
  ) : (
    <div className={cn("cl-midx", className)}>{body}</div>
  )
}

/** A question in the FAQ list — native <details>, no script. */
export function Disclosure({
  question,
  children,
  className,
}: {
  question: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <details
      className={cn(
        "group border-b border-(--color-divider) py-3.25",
        className
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[14px] md:text-[15px]">
        <span className="min-w-0 flex-1">{question}</span>
        <span
          aria-hidden
          className="flex size-6 flex-none items-center justify-center text-(--color-accent) transition-transform duration-200 ease-out group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="grid grid-rows-[0fr] overflow-hidden opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out group-open:grid-rows-[1fr] group-open:opacity-100">
        <p className="mt-2.5 mb-0 min-h-0 text-[13px] leading-[1.7] text-neutral-700">
          {children}
        </p>
      </div>
    </details>
  )
}
