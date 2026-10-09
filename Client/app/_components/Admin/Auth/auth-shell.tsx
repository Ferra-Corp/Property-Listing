"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "cn"
import { Plate } from "../../ui/plate"
import { useRandomListingPlate } from "./useRandomListingPlate"
import { deskFact, useAuthContact } from "./useAuthContact"

export type Fact = { label: string; value: React.ReactNode }

/**
 * The two-pane door. Left: the firm's standing, carried over a plate at low
 * opacity — on a phone it collapses to a short header band so the keyboard has
 * room. Right: one task and nothing else.
 */
export function AuthShell({
  kicker,
  title,
  lead,
  quote,
  facts: ownFacts = [],
  desk,
  back,
  topRight,
  footNote,
  compact,
  children,
}: {
  kicker?: React.ReactNode
  title: React.ReactNode
  lead?: React.ReactNode
  quote?: React.ReactNode
  facts?: Fact[]
  /** append the firm's real phone and email from Site settings as a fact */
  desk?: boolean
  /** shown top-left of the right pane, and in the phone band */
  back?: { href: string; label: string }
  topRight?: React.ReactNode
  footNote?: React.ReactNode
  /** the shorter pane used by the one-field screens */
  compact?: boolean
  children: React.ReactNode
}) {
  const listingPlate = useRandomListingPlate(),
    contact = useAuthContact(),
    facts =
      desk && contact.ready ? [...ownFacts, deskFact(contact)] : ownFacts

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] md:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] md:grid-rows-1">
      {/* ── Left pane / phone band ──
          Pinned to the light theme's palette on purpose: the accent scale
          inverts in dark mode (accent-900 becomes cream), which would turn
          this pane light and leave dark text on it. It is a photo-backed
          dark surface in both themes. */}
      <aside
        className={cn(
          "relative isolate grid overflow-hidden bg-[#3a2714] px-5 py-5 text-[#f7f3e3]",
          "h-47.5 grid-rows-[auto_1fr] md:h-auto md:grid-rows-[auto_1fr_auto] md:px-10 md:py-8.5",
          compact && "md:px-8 md:py-7"
        )}
      >
        <Plate
          className={cn(
            "cl-ph-dark absolute inset-0 -z-10",
            !listingPlate?.src && "opacity-[.45] md:opacity-50"
          )}
          src={listingPlate?.src}
          alt={listingPlate?.alt}
        />

        {/* A real photo runs at full brightness/contrast, so it needs its
            own scrim for the text sitting on top — the hatch placeholder
            is already dim enough on its own and skips this. */}
        {listingPlate?.src ? (
          <div className="pointer-events-none absolute inset-0 z-[-6] bg-black/60" />
        ) : null}

        {/* Caption names the real listing in the photo; with no photo there
            is nothing true to caption, so none is shown. Sits above the
            plate but below the pane's own foreground content — capped
            narrower than the wordmark's row so a long listing title wraps
            onto its own lines instead of crowding into it. */}
        {listingPlate ? (
          <div className="pointer-events-none absolute inset-0 z-[-5] grid items-start justify-items-end p-3 md:p-4">
            <span className="cl-mono max-w-[52%] text-right text-[10px] leading-normal tracking-[0.14em] uppercase opacity-80 md:max-w-[46%] md:text-[11px]">
              {listingPlate.caption}
            </span>
          </div>
        ) : null}

        {/* Both left-aligned on mobile: this row used to push the wordmark
            all the way to the far right with a spacer, straight into the
            caption's own top-right corner (also visible in the plate
            below, sharing the same absolute-positioned space). */}
        <div className="flex items-center gap-3 md:block">
          {back ? (
            <Link href={back.href} className="cl-k text-[#dbbb8f] md:hidden">
              ← {back.label}
            </Link>
          ) : null}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dg-logo-dark.png"
              alt="D&G Realtors"
              className="h-6 w-auto shrink-0 object-contain md:h-7"
              draggable={false}
            />
          </div>
          <div className="cl-k mt-2 hidden text-[#dbbb8f] md:block">
            Property · Nairobi
          </div>
        </div>

        <div className="flex flex-col justify-end gap-0 py-0 md:justify-center md:gap-4.5 md:py-6.5">
          {kicker ? (
            <div className="cl-k hidden text-[#dbbb8f] md:block">{kicker}</div>
          ) : null}
          <h1
            className={cn(
              "m-0 max-w-[20ch] font-(family-name:--font-heading) text-[20px] leading-[1.2] font-normal [text-shadow:0_1px_10px_rgba(0,0,0,.5)]",
              compact ? "md:text-[26px]" : "md:text-[28px]",
              "md:leading-[1.18]"
            )}
          >
            {title}
          </h1>
          {lead ? (
            <p className="m-0 hidden max-w-[44ch] text-[13.5px] leading-[1.65] text-pretty text-[#e8dfcc] [text-shadow:0_1px_8px_rgba(0,0,0,.5)] md:block">
              {lead}
            </p>
          ) : null}
          {quote ? (
            <div className="hidden border-l-2 border-(--color-accent) py-0.5 pl-4 font-(family-name:--font-heading) text-[16px] leading-normal text-[#f1eadc] [text-shadow:0_1px_8px_rgba(0,0,0,.5)] md:block">
              {quote}
            </div>
          ) : null}
        </div>

        {facts.length ? (
          <div
            className={cn(
              "hidden gap-4.5 border-t border-[rgba(247,243,227,.2)] pt-5 md:grid",
              facts.length === 1 ? "md:grid-cols-1" : "md:grid-cols-3"
            )}
          >
            {facts.map((fact) => (
              <div key={fact.label}>
                <div className="cl-k text-[#dbbb8f]">{fact.label}</div>
                <div className="cl-fig mt-1.75 text-[13px] leading-[1.6]">
                  {fact.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </aside>

      {/* ── Right pane ── */}
      <div className="grid grid-rows-[auto_1fr_auto] overflow-hidden bg-(--color-bg) px-4.5 py-5 md:px-11 md:py-8.5">
        <div className="flex items-center gap-3">
          {back ? (
            <Link
              href={back.href}
              className="cl-k hidden text-neutral-600 md:block"
            >
              ← {back.label}
            </Link>
          ) : null}
          <span className="flex-1" />
          {topRight}
        </div>

        <div className="flex flex-col items-start justify-start pt-4 md:justify-center">
          <div className="w-full max-w-98">{children}</div>
        </div>

        <div className="pt-4">
          {facts.length ? (
            <div className="mb-4 border-t border-(--color-divider) bg-neutral-100 px-4.5 py-4 md:hidden">
              {facts.map((fact, index) => (
                <div
                  key={fact.label}
                  className={cn(
                    "cl-pair text-[13px]",
                    index === 0 && "pt-0",
                    index === facts.length - 1 && "border-b-0"
                  )}
                >
                  <span className="text-neutral-700">{fact.label}</span>
                  <span className="cl-fig text-right">{fact.value}</span>
                </div>
              ))}
            </div>
          ) : null}
          {footNote ? (
            <div className="cl-k leading-[1.7] text-neutral-600">
              {footNote}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** The address strip: the token abbreviated, and how long it has left. */
export function TokenStrip({
  url,
  status,
  tone = "accent",
}: {
  url: string
  status?: string
  tone?: "accent" | "warn"
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-(--color-divider) bg-neutral-100 px-3 py-1.75">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-none"
        aria-hidden
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <div className="cl-k cl-fig overflow-hidden text-ellipsis whitespace-nowrap text-neutral-700">
        {url}
      </div>
      <span className="flex-1" />
      {status ? (
        <span
          className={cn(
            "cl-k cl-mono rounded-[3px] px-2 py-0.75 whitespace-nowrap",
            tone === "warn"
              ? "bg-(--color-accent-2-100) text-(--color-accent-2-700)"
              : "bg-(--color-accent-100) text-(--color-accent-800)"
          )}
        >
          {status}
        </span>
      ) : null}
    </div>
  )
}

/** Small caps kicker over a normal-weight heading — the head of every pane. */
export function PaneHead({
  kicker,
  title,
  children,
  className,
}: {
  kicker: string
  title: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="cl-k text-(--color-accent)">{kicker}</div>
      <h2 className="mt-3 mb-0 text-[26px] leading-[1.15] font-normal md:text-[32px]">
        {title}
      </h2>
      {children ? (
        <p className="mt-3 mb-0 text-[13.5px] leading-[1.75] text-neutral-700 md:text-[14px]">
          {children}
        </p>
      ) : null}
    </div>
  )
}

/** A hairline-bordered checkbox row. */
export function CheckLine({
  children,
  className,
  ...props
}: React.ComponentProps<"input"> & { children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 text-[13px] leading-normal text-(--color-text)",
        className
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 accent-(--color-accent) disabled:opacity-45"
        {...props}
      />
      <span>{children}</span>
    </label>
  )
}

/** The tinted note used for a refusal or a caution. */
export function Notice({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "quiet"
  children: React.ReactNode
}) {
  if (tone === "quiet") {
    return (
      <div className="flex items-start gap-2.5 rounded-(--cl-radius-md) border border-(--color-divider) bg-neutral-100 px-3.5 py-3">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 flex-none"
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div className="cl-k leading-[1.7] text-neutral-700">{children}</div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2.5 rounded-(--cl-radius-md) border border-(--color-accent-2-300) bg-(--color-accent-2-100) px-3.5 py-3">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-accent-2)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 flex-none"
        aria-hidden
      >
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </svg>
      <div>{children}</div>
    </div>
  )
}

/** Hairline label/figure rows — what the link will and will not disturb. */
export function PairList({
  rows,
}: {
  rows: [React.ReactNode, React.ReactNode][]
}) {
  return (
    <div>
      {rows.map(([label, value], index) => (
        <div
          key={index}
          className={cn(
            "cl-pair text-[13px]",
            index === 0 && "pt-0",
            index === rows.length - 1 && "border-b-0"
          )}
        >
          <span className="text-neutral-700">{label}</span>
          <span className="cl-fig text-right">{value}</span>
        </div>
      ))}
    </div>
  )
}

/** A ringed glyph — the mark at the head of a terminal state. */
export function StateMark({
  tone = "accent",
  children,
}: {
  tone?: "accent" | "warn"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full border",
        tone === "warn"
          ? "border-(--color-accent-2) text-(--color-accent-2)"
          : "border-(--color-accent) text-(--color-accent)"
      )}
    >
      {children}
    </div>
  )
}

/** A numbered instruction. */
export function Step({
  n,
  children,
}: {
  n: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.75 text-[13.5px] leading-[1.7] md:text-[14px]">
      <span className="cl-k cl-fig flex-none pt-1 text-(--color-accent)">
        {n}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
