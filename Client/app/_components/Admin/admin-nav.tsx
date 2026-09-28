"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun } from "lucide-react"
import {
  AgentsIcon,
  AnalyticsIcon,
  AuditIcon,
  CurrencyIcon,
  DashboardIcon,
  InsightsIcon,
  LeadsIcon,
  ListingsIcon,
  ProfileIcon,
  ServicesIcon,
  SettingsIcon,
  SubscribersIcon,
  ValuationsIcon,
  ViewingsIcon,
} from "./icons"
import { useUserContext } from "@/app/_lib/Context/User"
import { useListingContext } from "@/app/_lib/Context/Listing"
import { useLeadContext } from "@/app/_lib/Context/Lead"
import { useViewingContext } from "@/app/_lib/Context/Viewing Request"
import { useValuationContext } from "@/app/_lib/Context/Valuation Request"
import { hasPermission, type Permission } from "@/app/_lib/permissions"
import type { UserRole } from "@/app/_lib/Types/User"

// Dependency-free class name utility
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

// --- TYPES ---

export type Item = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  /** the standing figure at the right of the rail */
  count?: string
  /** lava rather than gold — something is waiting */
  urgent?: boolean
  /** Omitted entirely means every role can see it (no backend read-gate
   * exists for it either — e.g. Listings, Staff, Insights). Present means
   * the role needs at least one of these to see the tab at all. */
  permission?: Permission | Permission[]
}

export type NavGroup = {
  key: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: Item[]
}

// --- CONSTANTS ---

// Listings/Leads/Viewings/Valuations don't carry a `count` here — it used
// to be a hardcoded placeholder ("84", "7 new"...) that never matched real
// data. useAdminNav() now fills these in live from each item's own context,
// keyed by href — see LIVE_COUNT_HREFS below.
export const PRIMARY: Item[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  {
    href: "/admin/listings",
    label: "Listings",
    icon: ListingsIcon,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: LeadsIcon,
    permission: "View lead",
  },
  {
    href: "/admin/viewings",
    label: "Viewings",
    icon: ViewingsIcon,
    permission: "View viewing request",
  },
  {
    href: "/admin/valuations",
    label: "Valuations",
    icon: ValuationsIcon,
    permission: "View valuation request",
  },
]

export const SECONDARY: Item[] = [
  { href: "/admin/agents", label: "Staff", icon: AgentsIcon },
  { href: "/admin/insights", label: "Insights", icon: InsightsIcon },
  { href: "/admin/services", label: "Services", icon: ServicesIcon },
  {
    href: "/admin/subscribers",
    label: "Subscribers",
    icon: SubscribersIcon,
    permission: "View subscriber",
  },
  { href: "/admin/analytics", label: "Analytics", icon: AnalyticsIcon },
]

export const TERTIARY: Item[] = [
  {
    href: "/admin/site-settings",
    label: "Site settings",
    icon: SettingsIcon,
    // No "View site setting" permission exists — only admin holds any of
    // the create/edit/delete trio, so any one of them is an accurate
    // stand-in for "is this an admin".
    permission: "Edit site setting",
  },
  {
    href: "/admin/currencies",
    label: "Currency & rates",
    icon: CurrencyIcon,
    permission: "Edit currency",
  },
  {
    href: "/admin/audit-log",
    label: "Audit log",
    icon: AuditIcon,
    permission: "View logs",
  },
]

export const GROUPS: NavGroup[] = [
  { key: "primary", label: "Operations", icon: DashboardIcon, items: PRIMARY },
  { key: "secondary", label: "Content", icon: AgentsIcon, items: SECONDARY },
  { key: "tertiary", label: "System", icon: SettingsIcon, items: TERTIARY },
]

// --- HOOKS ---

function matchesItem(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
}

function itemVisible(role: UserRole | undefined, item: Item): boolean {
  if (!item.permission) return true

  const permissions = Array.isArray(item.permission)
    ? item.permission
    : [item.permission]

  return permissions.some((permission) => hasPermission(role, permission))
}

/** A tab a role has no items left in (e.g. "System" for anyone but admin)
 * disappears from the dock entirely, rather than opening to an empty page. */
function visibleGroups(role: UserRole | undefined): NavGroup[] {
  return GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => itemVisible(role, item)),
  })).filter((group) => group.items.length > 0)
}

function groupIndexForPath(pathname: string, groups: NavGroup[]): number {
  const index = groups.findIndex((group) =>
    group.items.some((item) => matchesItem(pathname, item.href))
  )
  return index === -1 ? 0 : index
}

type LiveCount = { count: string; urgent?: boolean }

/** Listings → published, Leads → new/uncontacted, Viewings/Valuations →
 * pending — mirrors how each of those figures is already defined on the
 * dashboard and on the pages' own queues, so the nav badge never disagrees
 * with what the page itself says. A permission-denied role just sees "0"
 * here (its context array stays empty), which is moot anyway since
 * itemVisible() already hides the tab entirely for it. */
function useLiveCounts(): Record<string, LiveCount> {
  const { listings } = useListingContext()
  const { leads } = useLeadContext()
  const { viewingRequests } = useViewingContext()
  const { valuationRequests } = useValuationContext()

  return React.useMemo(() => {
    const newLeads = leads.filter((l) => l.status === "new").length
    const pendingViewings = viewingRequests.filter(
      (v) => v.status === "pending"
    ).length
    const pendingValuations = valuationRequests.filter(
      (v) => v.status === "pending"
    ).length
    const publishedListings = listings.filter(
      (l) => l.status === "published"
    ).length

    return {
      "/admin/listings": { count: String(publishedListings) },
      "/admin/leads": { count: String(newLeads), urgent: newLeads > 0 },
      "/admin/viewings": { count: String(pendingViewings) },
      "/admin/valuations": { count: String(pendingValuations) },
    }
  }, [listings, leads, viewingRequests, valuationRequests])
}

function withLiveCounts(
  groups: NavGroup[],
  counts: Record<string, LiveCount>
): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      counts[item.href] ? { ...item, ...counts[item.href] } : item
    ),
  }))
}

export function useAdminNav() {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const { currentUser } = useUserContext()
  const liveCounts = useLiveCounts()

  const groups = React.useMemo(
    () => withLiveCounts(visibleGroups(currentUser?.role), liveCounts),
    [currentUser?.role, liveCounts]
  )

  const routeGroupIndex = groupIndexForPath(pathname, groups)
  const [manualGroupIndex, setManualGroupIndex] = React.useState<number | null>(
    null
  )

  // Clear the manual override cleanly when the route actually changes
  React.useEffect(() => {
    setManualGroupIndex(null)
  }, [pathname])

  const activeGroupIndex = manualGroupIndex ?? routeGroupIndex

  // Picking a wing from the dock used to only swap which wing's pages the
  // top menu offered, leaving you on whatever page you already happened to
  // be on — landing on the wing's own first page took a second, separate
  // tap into the (now-open) top menu. This jumps straight there instead,
  // same as picking that page directly would. Re-tapping the wing you're
  // already in is left alone (no-op) rather than yanking you back to its
  // first page and off whatever page inside it you're currently on.
  function selectGroup(index: number) {
    if (index === activeGroupIndex) return

    setManualGroupIndex(index)
    const firstHref = groups[index]?.items[0]?.href
    if (firstHref) router.push(firstHref)
  }

  return {
    groups,
    activeGroupIndex,
    selectGroup,
  }
}

// --- SUBCOMPONENTS ---

export function AdminThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Safe SSR hydration approach
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      // Sits on the header's own solid pill now — no double border, just
      // a subtle hover fill and the icon.
      className="flex size-9 flex-none items-center justify-center rounded-full text-(--color-admin-text-muted) transition-colors duration-200 outline-none hover:bg-(--color-admin-hover) hover:text-(--color-admin-text) focus-visible:ring-2 focus-visible:ring-(--color-admin-accent)"
    >
      {mounted ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Moon size={16} strokeWidth={1.8} />
            ) : (
              <Sun size={16} strokeWidth={1.8} />
            )}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span className="size-4" /> // Placeholder to prevent layout shift
      )}
    </motion.button>
  )
}

function ProfileMenu() {
  const { currentUser } = useUserContext()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    setOpen(false)
    setSigningOut(true)
    try {
      await fetch("/admin/api/auth/logout", { method: "POST" })
    } finally {
      router.push("/admin/auth/sign-in")
    }
  }

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false)
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex size-11 flex-none items-center justify-center rounded-2xl transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-(--color-admin-accent)",
          "text-(--color-admin-text-muted) hover:bg-(--color-admin-hover) hover:text-(--color-admin-text)",
          open && "bg-(--color-admin-hover-active) text-(--color-admin-text)"
        )}
      >
        <ProfileIcon size={19} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 bottom-full z-30 mb-2 min-w-47.5 rounded-xl border border-(--color-divider) bg-(--color-bg) p-1.5 shadow-lg backdrop-blur-md"
          >
            <div className="px-2.5 pt-1.5 pb-1">
              <div className="truncate text-[13px] font-medium text-(--color-text)">
                {currentUser?.name}
              </div>
              <div className="truncate text-[11px] text-neutral-600">
                {currentUser?.role}
              </div>
            </div>
            <hr className="mx-1 my-1.5 border-t border-(--color-divider)" />
            <Link
              role="menuitem"
              href="/admin/my-profile"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2.5 py-2 text-[13px] text-(--color-text) transition-colors outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100"
            >
              My profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-(--color-text) transition-colors outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- MAIN COMPONENTS ---

/**
 * One pill per page in the active wing, icon and label always both shown —
 * this only ever renders at md: and up (AdminShell swaps it for
 * AdminGroupMenu's hamburger below that), so it never has to squeeze down
 * to icon-only the way it once did on a phone.
 */
function TopTabItem({
  item: { href, label, icon: Icon, count, urgent },
}: {
  item: Item
}) {
  const pathname = usePathname() ?? ""
  const active = matchesItem(pathname, href)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-none items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-(--color-admin-accent)",
        "text-(--color-admin-text-muted) hover:text-(--color-admin-text)",
        "[&_svg]:flex-none [&_svg]:opacity-70 [&_svg]:transition-opacity hover:[&_svg]:opacity-100"
      )}
    >
      {active && (
        <motion.span
          layoutId="admin-top-tab-active"
          className="absolute inset-0 rounded-full bg-(--color-admin-active)"
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        />
      )}
      <span
        className={cn(
          "relative z-10 flex items-center gap-2",
          active && "text-(--color-admin-text) [&_svg]:opacity-100"
        )}
      >
        <Icon size={15} />
        <span className="truncate">{label}</span>
        {count && (
          <span
            className={cn(
              "font-mono text-[11px] tracking-tight",
              active
                ? "text-(--color-admin-text-muted)"
                : urgent
                  ? "text-(--color-admin-accent-urgent)"
                  : "text-(--color-admin-accent)"
            )}
          >
            {count}
          </span>
        )}
      </span>
    </Link>
  )
}

/** md: and up — see TopTabItem. Below that, AdminShell renders
 * AdminGroupMenu's hamburger instead. */
export function AdminGroupTabs({ items }: { items: Item[] }) {
  const pathname = usePathname() ?? ""
  const navRef = React.useRef<HTMLElement>(null)

  // Deferred a frame: right on mount/navigation the browser hasn't always
  // finished layout for this row yet, so scrollIntoView's own measurement
  // of "is this already visible" can be wrong and silently no-op.
  React.useEffect(() => {
    const activeIndex = items.findIndex((item) =>
      matchesItem(pathname, item.href)
    )
    if (activeIndex === -1) return

    const frame = requestAnimationFrame(() => {
      const activeItem = navRef.current?.children[activeIndex] as
        HTMLElement | undefined
      activeItem?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, items])

  return (
    <nav
      ref={navRef}
      aria-label="Section pages"
      // No encompassing surface — the active pill (via layoutId in
      // TopTabItem) is the only fill; the rest sits directly on the
      // header background. overflow-x-auto stays as a defensive fallback
      // for wings with more pages than the row can hold.
      className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto"
    >
      {items.map((item) => (
        <TopTabItem key={item.href} item={item} />
      ))}
    </nav>
  )
}

/**
 * Below md:, the tab row above has no room to keep every page's name
 * legible, so this swaps in a hamburger instead, mirroring the public
 * SiteHeader's own menu button: one compact trigger — showing the current
 * page's own icon and name, so you don't lose that at a glance — that
 * opens a dropdown listing every page in the active wing, each with its
 * icon and full name always visible.
 */
export function AdminGroupMenu({ items }: { items: Item[] }) {
  const pathname = usePathname() ?? ""
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const activeItem =
    items.find((item) => matchesItem(pathname, item.href)) ?? items[0]

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div className="relative flex min-w-0 justify-center" ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open section menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-full border border-(--color-admin-border) py-1.5 pr-3.5 pl-1.5 text-[13px] whitespace-nowrap text-(--color-admin-text) shadow-(--shadow-sm) backdrop-blur-md transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-(--color-admin-accent)",
          open
            ? "bg-(--color-admin-hover-active)"
            : "bg-[color-mix(in_srgb,var(--color-admin-bg)_30%,transparent)] hover:bg-(--color-admin-hover)"
        )}
      >
        <span className="flex size-6.5 flex-none items-center justify-center rounded-full bg-(--color-admin-active) text-(--color-admin-text)">
          <Menu size={13} strokeWidth={1.8} />
        </span>
        {activeItem ? (
          <span className="flex min-w-0 items-center gap-1.75">
            <activeItem.icon size={15} className="flex-none opacity-80" />
            <span className="min-w-0 truncate">{activeItem.label}</span>
          </span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Section pages"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute top-full left-1/2 z-30 mt-2 flex w-56 -translate-x-1/2 flex-col gap-0.5 rounded-xl border border-(--color-divider) bg-(--color-bg) p-1.5 shadow-(--shadow-md)"
          >
            {items.map((item) => {
              const active = matchesItem(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.25 text-[13.5px] transition-colors",
                    active
                      ? "bg-(--color-accent-2-100) text-(--color-accent-2-700)"
                      : "text-(--color-text) hover:bg-neutral-100"
                  )}
                >
                  <item.icon
                    size={16}
                    className={cn("flex-none", !active && "opacity-70")}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count ? (
                    <span
                      className={cn(
                        "font-mono text-[11px] tracking-tight",
                        item.urgent
                          ? "text-(--color-accent-2)"
                          : "text-(--color-accent)"
                      )}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AdminDock({
  groups,
  activeGroupIndex,
  onSelect,
}: {
  groups: NavGroup[]
  activeGroupIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <nav
      aria-label="Admin sections"
      // Solid, like the header — same deep shadow too, so the two "docks"
      // lift off the page the same way.
      className="flex items-center gap-1.5 rounded-full border border-(--color-admin-border) bg-(--color-admin-bg) p-1.5 shadow-(--shadow-lg)"
    >
      <div className="flex items-center gap-1">
        {groups.map((group, index) => {
          const active = index === activeGroupIndex
          return (
            <motion.button
              key={group.key}
              layout
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={active ? "true" : undefined}
              aria-label={group.label}
              title={group.label}
              className={cn(
                "flex h-11 flex-none items-center justify-center gap-2 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-(--color-admin-accent)",
                active
                  ? "bg-(--color-admin-active) px-4 text-(--color-admin-text)"
                  : "w-11 text-(--color-admin-text-muted) hover:bg-(--color-admin-hover) hover:text-(--color-admin-text)"
              )}
            >
              <group.icon size={20} />
              {active && (
                <span className="text-[13px] whitespace-nowrap">
                  {group.label}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      <span className="mx-1 h-6 w-px flex-none bg-(--color-admin-border)" />

      <ProfileMenu />
    </nav>
  )
}
