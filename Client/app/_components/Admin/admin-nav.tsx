"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import {
  AgentsIcon,
  AnalyticsIcon,
  AuditIcon,
  DashboardIcon,
  InsightsIcon,
  LeadsIcon,
  ListingsIcon,
  MenuIcon,
  ServicesIcon,
  SettingsIcon,
  ValuationsIcon,
  ViewingsIcon,
} from "./icons"

type Item = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  /** the standing figure at the right of the rail */
  count?: string
  /** lava rather than gold — something is waiting */
  urgent?: boolean
}

/** The register, the diary, the ledger — then the people, then the machinery. */
export const PRIMARY: Item[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/listings", label: "Listings", icon: ListingsIcon, count: "84" },
  { href: "/admin/leads", label: "Leads", icon: LeadsIcon, count: "7 new", urgent: true },
  { href: "/admin/viewings", label: "Viewings", icon: ViewingsIcon, count: "4" },
  { href: "/admin/valuations", label: "Valuations", icon: ValuationsIcon, count: "3" },
]

export const SECONDARY: Item[] = [
  { href: "/admin/agents", label: "Agents", icon: AgentsIcon },
  { href: "/admin/insights", label: "Insights", icon: InsightsIcon },
  { href: "/admin/services", label: "Services", icon: ServicesIcon },
  { href: "/admin/analytics", label: "Analytics", icon: AnalyticsIcon },
]

export const TERTIARY: Item[] = [
  { href: "/admin/site-settings", label: "Site settings", icon: SettingsIcon },
  { href: "/admin/audit-log", label: "Audit log", icon: AuditIcon },
]

function useActive(href: string) {
  const pathname = usePathname() ?? ""
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
}

function NavItem({ item }: { item: Item }) {
  const active = useActive(item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-[11px] rounded-[4px] px-[11px] py-2 text-[13.5px]",
        "text-[var(--color-neutral-200)] hover:bg-[rgba(247,243,227,.09)] hover:text-white",
        "[&_svg]:flex-none [&_svg]:opacity-[.72] hover:[&_svg]:opacity-100",
        active && "bg-[rgba(247,243,227,.14)] text-white [&_svg]:opacity-100",
      )}
    >
      <Icon size={15} />
      {item.label}
      {item.count ? (
        <span
          className={cn(
            "cl-fig cl-mono ml-auto text-[11px]",
            item.urgent ? "text-[var(--color-accent-2-300)]" : "text-[var(--color-accent-300)]",
          )}
        >
          {item.count}
        </span>
      ) : null}
    </Link>
  )
}

function Rule() {
  return <hr className="mx-[11px] my-2.5 h-px border-0 bg-[rgba(247,243,227,.18)]" />
}

/** The dark colophon rail. Desktop only — the phone gets the tab bar below. */
export function AdminRail() {
  return (
    <nav className="my-3.5 ml-3.5 hidden flex-col gap-1 overflow-auto rounded-[var(--cl-radius-lg)] bg-[var(--color-accent-900)] px-3 py-[18px] shadow-[var(--shadow-lg)] md:flex">
      <div className="px-[11px] pt-1 pb-4">
        <div className="cl-mono text-[14px] tracking-[0.16em] text-[#F7F3E3] uppercase">
          [ entity ]
        </div>
        <div className="cl-k mt-[7px] text-[var(--color-neutral-400)]">Admin</div>
      </div>

      {PRIMARY.map((item) => (
        <NavItem key={item.href} item={item} />
      ))}
      <Rule />
      {SECONDARY.map((item) => (
        <NavItem key={item.href} item={item} />
      ))}
      <Rule />
      {TERTIARY.map((item) => (
        <NavItem key={item.href} item={item} />
      ))}

      <div className="flex-1" />
      <div className="mt-3 border-t border-[rgba(247,243,227,.18)] px-[11px] py-3">
        <div className="text-[13px] text-[#F7F3E3]">Dennis Onyiego</div>
        <div className="cl-k mt-[5px] text-[var(--color-neutral-400)]">
          Admin · designated poster
        </div>
        <div className="mt-2 flex gap-2 text-[12px]">
          <Link href="/admin/my-profile" className="text-[var(--color-accent-300)]">
            My profile
          </Link>
          <span className="text-[var(--color-neutral-600)]">·</span>
          <Link href="/auth/sign-in" className="text-[var(--color-accent-300)]">
            Sign out
          </Link>
        </div>
      </div>
    </nav>
  )
}

const TABS: Item[] = [
  { href: "/admin/listings", label: "Listings", icon: ListingsIcon },
  { href: "/admin/leads", label: "Leads", icon: LeadsIcon },
  { href: "/admin/viewings", label: "Diary", icon: ViewingsIcon },
  { href: "/admin/valuations", label: "Values", icon: ValuationsIcon },
  { href: "/admin/more", label: "More", icon: MenuIcon },
]

/** The phone's five doors, on the same dark ground as the rail. */
export function AdminTabs() {
  const pathname = usePathname() ?? ""
  return (
    <nav className="grid grid-cols-5 border-t border-[var(--color-divider)] bg-[var(--color-accent-900)] md:hidden">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "cl-mono flex min-h-[56px] flex-col items-center gap-1.5 px-0 pt-[11px] pb-3.5 text-[9.5px] tracking-[0.1em] uppercase",
              active
                ? "text-[#F7F3E3] [&_svg]:opacity-100"
                : "text-[var(--color-neutral-400)] [&_svg]:opacity-70",
            )}
          >
            <Icon size={17} />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
