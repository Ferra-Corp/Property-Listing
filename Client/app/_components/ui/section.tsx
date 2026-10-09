"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
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

/**
 * A question in the FAQ list. Not a native <details>: its closed content is
 * `display: none`, so there is nothing for a CSS transition to run on and it
 * snaps open and shut. State-driven instead, with the height animated by
 * motion (honouring reduced-motion) and the usual button/region ARIA wiring.
 */
export function Disclosure({
  question,
  children,
  className,
}: {
  question: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(false),
    panelId = React.useId(),
    reduceMotion = useReducedMotion()

  return (
    <div
      className={cn("border-b border-(--color-divider) py-3.25", className)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 text-left text-[14px] md:text-[15px]"
      >
        <span className="min-w-0 flex-1">{question}</span>
        <span
          aria-hidden
          className={cn(
            "flex size-6 flex-none items-center justify-center text-(--color-accent) transition-transform duration-200 ease-out",
            open && "rotate-45"
          )}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.25,
              ease: "easeOut",
            }}
            className="overflow-hidden"
          >
            <p className="mt-2.5 mb-0 text-[13px] leading-[1.7] text-neutral-700">
              {children}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
