"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import {
  AgentsIcon,
  AnalyticsIcon,
  AuditIcon,
  DashboardIcon,
  InsightsIcon,
  LeadsIcon,
  ListingsIcon,
  ProfileIcon,
  ServicesIcon,
  SettingsIcon,
  ValuationsIcon,
  ViewingsIcon,
} from "./icons"
import { useUserContext } from "@/app/_lib/Context/User"

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
}

export type NavGroup = {
  key: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: Item[]
}

// --- CONSTANTS ---

export const PRIMARY: Item[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  {
    href: "/admin/listings",
    label: "Listings",
    icon: ListingsIcon,
    count: "84",
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: LeadsIcon,
    count: "7 new",
    urgent: true,
  },
  {
    href: "/admin/viewings",
    label: "Viewings",
    icon: ViewingsIcon,
    count: "4",
  },
  {
    href: "/admin/valuations",
    label: "Valuations",
    icon: ValuationsIcon,
    count: "3",
  },
]

export const SECONDARY: Item[] = [
  { href: "/admin/agents", label: "Staff", icon: AgentsIcon },
  { href: "/admin/insights", label: "Insights", icon: InsightsIcon },
  { href: "/admin/services", label: "Services", icon: ServicesIcon },
  { href: "/admin/analytics", label: "Analytics", icon: AnalyticsIcon },
]

export const TERTIARY: Item[] = [
  { href: "/admin/site-settings", label: "Site settings", icon: SettingsIcon },
  { href: "/admin/audit-log", label: "Audit log", icon: AuditIcon },
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

function useActive(href: string) {
  const pathname = usePathname() ?? ""
  return matchesItem(pathname, href)
}

function groupIndexForPath(pathname: string): number {
  const index = GROUPS.findIndex((group) =>
    group.items.some((item) => matchesItem(pathname, item.href))
  )
  return index === -1 ? 0 : index
}

export function useAdminNav() {
  const pathname = usePathname() ?? ""
  const routeGroupIndex = groupIndexForPath(pathname)
  const [manualGroupIndex, setManualGroupIndex] = React.useState<number | null>(
    null
  )

  // Clear the manual override cleanly when the route actually changes
  React.useEffect(() => {
    setManualGroupIndex(null)
  }, [pathname])

  const activeGroupIndex = manualGroupIndex ?? routeGroupIndex

  return {
    groups: GROUPS,
    activeGroupIndex,
    selectGroup: setManualGroupIndex,
  }
}

// --- SUBCOMPONENTS ---

function TopTabItem({
  item: { href, label, icon: Icon, count, urgent },
}: {
  item: Item
}) {
  const active = useActive(href)

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
          active && "font-medium text-(--color-admin-text) [&_svg]:opacity-100"
        )}
      >
        <Icon size={15} />
        <span className="truncate">{label}</span>
        {count && (
          <span
            className={cn(
              "font-mono text-[11px] font-semibold tracking-tight",
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

export function AdminGroupTabs({ items }: { items: Item[] }) {
  return (
    <nav
      aria-label="Section pages"
      // Added a background, border, and padding here to turn the tabs container into a distinct "selector" block
      className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto rounded-full border border-(--color-admin-border) bg-(--color-admin-bg) p-1 shadow-sm backdrop-blur-md"
    >
      {items.map((item) => (
        <TopTabItem key={item.href} item={item} />
      ))}
    </nav>
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
      className="flex items-center gap-1.5 rounded-full border border-(--color-admin-border) bg-(--color-admin-bg) p-1.5 shadow-(--shadow-md) backdrop-blur-sm"
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
                <span className="text-[13px] font-medium whitespace-nowrap">
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
