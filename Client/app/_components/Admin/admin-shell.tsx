"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "cn"
import {
  AdminDock,
  AdminGroupMenu,
  AdminGroupTabs,
  AdminThemeToggle,
  useAdminNav,
} from "./admin-nav"
import { SearchIcon } from "./icons"

/**
 * The desk: a top switcher for the active wing's pages, one sheet of ivory
 * in between, and a dock at the bottom for choosing the wing itself. Same
 * two-bar shape at every screen size — the top row just scrolls sideways
 * when a wing has more pages than fit.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { groups, activeGroupIndex, selectGroup } = useAdminNav(),
    activeGroup = groups[activeGroupIndex]

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-neutral-200">
      {/* Solid, not glass — the deep shadow is what lifts it off the page
          now, matching AdminDock below. */}
      <header className="sticky top-2.5 z-20 mx-3 mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border border-(--color-admin-border) bg-(--color-admin-bg) py-2.5 pr-4 pl-5 shadow-(--shadow-lg) md:top-3.5 md:mx-6 md:mt-3.5">
        <Link
          href="/admin"
          className="flex min-w-0 flex-none items-center overflow-hidden transition-opacity hover:opacity-80"
          aria-label="D&G Realtors — Admin"
        >
          {/* The admin header is permanently dark, so always the light-on-
              dark variant — no theme swap needed for this one. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dg-logo-dark.png"
            alt="D&G Realtors"
            className="h-7 w-auto shrink-0 object-contain md:h-8"
            draggable={false}
          />
        </Link>
        {/* Full icon+label tab row from md: up, where there's room for
            every page's name to stay legible; the hamburger below that,
            where there isn't. One wrapper so the header's three-column
            grid still sees a single item here. */}
        <div className="flex min-w-0 justify-center">
          <div className="hidden md:block">
            <AdminGroupTabs items={activeGroup.items} />
          </div>
          <div className="md:hidden">
            <AdminGroupMenu items={activeGroup.items} />
          </div>
        </div>
        <div className="flex justify-end">
          <AdminThemeToggle />
        </div>
      </header>

      {/* pb-24 reserves room for the floating dock below: without it, the
          last bit of a page's content ends up scrolled to directly behind
          the dock instead of clear above it. */}
      <main className="mx-3 mt-2.5 mb-2.5 min-w-0 overflow-x-hidden rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) pb-24 shadow-(--shadow-sm) md:mx-6 md:mt-3.5 md:mb-3.5">
        {children}
      </main>

      <div className="sticky bottom-2.5 z-20 mb-2.5 flex justify-center px-3 md:bottom-3.5 md:mb-3.5 md:px-0">
        <AdminDock
          groups={groups}
          activeGroupIndex={activeGroupIndex}
          onSelect={selectGroup}
        />
      </div>
    </div>
  )
}

/**
 * The sticky head of every desk page: title, the standing count beneath it,
 * and whatever tools the page needs on the right.
 */
export function PageHead({
  title,
  meta,
  search,
  searchValue,
  onSearchChange,
  children,
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  /** placeholder for the page's search field; omitted when the page has none */
  search?: string
  /** Controlled together with `search` — one field, working the same way
   * (and in the same place, via `order-last`/`md:order-0`) at every width,
   * instead of each page inventing its own mobile-only or desktop-only copy. */
  searchValue?: string
  onSearchChange?: (value: string) => void
  children?: React.ReactNode
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7 md:py-4.5">
      <div className="min-w-0">
        <h1 className="m-0 text-[24px] font-normal md:text-[26px]">{title}</h1>
        {meta ? (
          <div className="cl-k mt-1.5 text-neutral-600">{meta}</div>
        ) : null}
      </div>
      <span className="hidden flex-1 md:block" />
      {search ? (
        <label className="order-last flex min-h-9 w-full items-center gap-2 rounded-(--cl-radius-md) border border-(--color-divider) px-3 text-neutral-600 md:order-0 md:w-62.5">
          <SearchIcon size={14} className="flex-none" />
          <input
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="cl-input min-h-0 border-0 p-0 text-[13px]"
            placeholder={search}
            aria-label={search}
          />
        </label>
      ) : null}
      {children}
    </div>
  )
}

/** The horizontal band under the head: filters, sorts, the showing-count. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-4 md:flex-wrap md:overflow-visible md:px-7 md:pt-5">
      {children}
    </div>
  )
}

/** The body pad — every page's content sits inside one of these. */
export function Pad({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 md:px-7", className)} {...props} />
}
