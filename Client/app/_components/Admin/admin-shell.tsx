import * as React from "react"
import Link from "next/link"
import { cn } from "cn"
import { AdminRail, AdminTabs } from "./admin-nav"
import { MenuIcon, SearchIcon } from "./icons"

/**
 * The desk. A dark rail on the left, one sheet of ivory on the right; on a
 * phone the rail collapses to a header bar and the five-door tab bar.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-[var(--color-neutral-200)] md:grid-cols-[250px_minmax(0,1fr)] md:grid-rows-1">
      <header className="flex items-center gap-3 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-4 py-3.5 md:hidden">
        <button type="button" className="cl-btn cl-btn-secondary cl-btn-icon h-[34px] w-[34px]">
          <MenuIcon size={16} />
        </button>
        <div className="cl-mono text-[12px] tracking-[0.16em] uppercase">[ entity ]</div>
        <span className="flex-1" />
        <Link href="/admin/my-profile" className="cl-k text-[var(--color-neutral-600)]">
          Dennis O.
        </Link>
      </header>

      <AdminRail />

      <main className="min-w-0 overflow-x-hidden bg-[var(--color-bg)] md:m-3.5 md:rounded-[var(--cl-radius-lg)] md:border md:border-[var(--color-divider)] md:shadow-[var(--shadow-sm)]">
        {children}
      </main>

      <AdminTabs />
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
  children,
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  /** placeholder for the page's search field; omitted when the page has none */
  search?: string
  children?: React.ReactNode
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3.5 border-b border-[var(--color-divider)] bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-[8px] md:px-7 md:py-[18px]">
      <div className="min-w-0">
        <h1 className="m-0 text-[24px] font-normal md:text-[26px]">{title}</h1>
        {meta ? <div className="cl-k mt-1.5 text-[var(--color-neutral-600)]">{meta}</div> : null}
      </div>
      <span className="hidden flex-1 md:block" />
      {search ? (
        <label className="order-last flex min-h-9 w-full items-center gap-2 rounded-[var(--cl-radius-md)] border border-[var(--color-divider)] px-3 text-[var(--color-neutral-600)] md:order-none md:w-[250px]">
          <SearchIcon size={14} className="flex-none" />
          <input
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
