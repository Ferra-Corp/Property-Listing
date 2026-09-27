"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Menu, Moon, Search, Sun, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "next-themes"
import { ButtonLink } from "./ui/button"
import { SiteSearch } from "./site-search"
import { MobileSearchDialog } from "./mobile-search-dialog"
import { useCurrencyContext } from "../_lib/Context/Currencies"
import { useSelectedCurrency } from "../_lib/Context/SelectedCurrency"

const MENU = [
  { label: "Buy", href: "/system/listings?purpose=sale" },
  { label: "Rent", href: "/system/listings?purpose=rent" },
  { label: "Lease", href: "/system/listings?purpose=lease" },
  { label: "Commercial", href: "/system/listings?type=commercial" },
]
const MENU_SECONDARY = [
  { label: "Agents", href: "/system/agents" },
  { label: "Insights", href: "/system/insights" },
  { label: "Services", href: "/system/services" },
  { label: "About", href: "/system/about" },
  { label: "Contact", href: "/system/contact" },
]

/**
 * Custom animated segmented control specifically for the header.
 * Uses layoutId to slide the active background smoothly between options.
 */
function AnimatedCurrencySwitcher({
  options,
  value,
  onChange,
  className,
  itemClassName,
  layoutIdPrefix,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  className?: string
  itemClassName?: string
  layoutIdPrefix: string
}) {
  return (
    <div
      // Increased to rounded-xl to fit nicely inside the rounded-2xl header
      className={`flex items-center rounded-xl border border-(--color-divider) bg-neutral-100/70 p-0.75 backdrop-blur-sm ${className}`}
    >
      {options.map((option) => {
        const isActive = value === option
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            type="button"
            // Innermost elements get rounded-lg for perfect nesting geometry
            className={`relative flex items-center justify-center rounded-lg transition-colors hover:text-(--color-text) ${
              isActive ? "text-(--color-text)" : "text-neutral-500"
            } ${itemClassName || "px-2.5 py-0.75 text-[12px]"}`}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-active-bg`}
                className="absolute inset-0 rounded-lg border border-(--color-divider) bg-(--color-bg) shadow-(--shadow-sm)"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 font-medium tracking-wide">
              {option}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * The segmented switcher only fits two or three codes before it runs out
 * of room, so on a phone it was silently dropping EUR/GBP/AED — this picks
 * from the full list instead, in the space of one small badge. A native
 * select is deliberate here: on mobile it opens the OS's own picker sheet,
 * which is a better way to choose one of five short codes than anything
 * custom would be.
 */
function CurrencyPicker({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative flex-none md:hidden">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Currency"
        className="cl-mono h-11 md:h-7.5 appearance-none rounded-lg border border-(--color-divider) bg-neutral-100/70 py-0 pr-5.5 pl-2.5 text-[16px] md:text-[11px] font-medium text-(--color-text) backdrop-blur-sm focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        strokeWidth={2.25}
        className="pointer-events-none absolute top-1/2 right-1.75 -translate-y-1/2 text-neutral-600"
      />
    </div>
  )
}

/**
 * Circular light/dark toggle. Sits beside the main header bar (~5% of its
 * width) rather than inside it, per the requested layout.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme(),
    [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex size-11 md:size-10 flex-none cursor-pointer items-center justify-center rounded-full border border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] text-(--color-text) shadow-(--shadow-sm) backdrop-blur-sm"
    >
      {mounted && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Moon size={16} strokeWidth={1.8} />
            ) : (
              <Sun size={16} strokeWidth={1.8} />
            )}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.button>
  )
}

export function SiteHeader() {
  const { currencies } = useCurrencyContext(),
    { currency, setCurrency } = useSelectedCurrency(),
    [isMenuOpen, setIsMenuOpen] = React.useState(false),
    [isSearchOpen, setIsSearchOpen] = React.useState(false),
    menuRef = React.useRef<HTMLDivElement>(null)

  const activeCurrencies = currencies
    .filter((c) => c.is_active)
    .sort((a, b) => {
      if (a.code === "KES") return -1
      if (b.code === "KES") return 1
      return a.sort_order - b.sort_order
    })

  const currencyOptions =
    activeCurrencies.length > 0
      ? activeCurrencies.map((c) => c.code)
      : ["KES", "USD", "GBP", "AED"]

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="sticky top-2.5 z-20 mx-3 mt-2.5 flex items-center gap-2 md:top-3.5 md:mx-6 md:mt-3.5 md:gap-3">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        // Increased header radius to rounded-2xl for a softer, floating look
        className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] py-2 pr-2 pl-3 shadow-(--shadow-sm) backdrop-blur-sm md:gap-3.5 md:py-2.5 md:pr-2.5 md:pl-4"
      >
        <div className="relative flex-none" ref={menuRef}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            // Increased to rounded-xl
            className="flex size-11 md:size-8.5 cursor-pointer list-none items-center justify-center rounded-sm border border-(--color-divider) text-(--color-text)"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <Menu size={16} strokeWidth={1.6} />
          </motion.button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                // Dropdown matches the header with rounded-2xl
                className="absolute top-9.5 left-0 z-30 flex min-w-53 flex-col rounded-xl border border-(--color-divider) bg-(--color-bg) p-2 shadow-(--shadow-md) md:top-10.5"
              >
                {MENU.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-2.5 py-2 text-[13.5px] text-(--color-text) transition-colors hover:bg-neutral-100"
                  >
                    {item.label}
                  </Link>
                ))}
                <hr className="cl-hr mx-1 my-1.5" />
                {MENU_SECONDARY.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-2.5 py-2 text-[13.5px] text-(--color-text) transition-colors hover:bg-neutral-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        <Link
          href="/"
          className="flex flex-1 items-baseline gap-2 transition-opacity hover:opacity-70 md:flex-none"
        >
          <span className="font-(family-name:--font-heading) text-[19px] leading-none text-(--color-text) md:text-[21px]">
            D&amp;G
          </span>
          <span className="cl-mono text-[10px] tracking-[0.18em] text-neutral-600 uppercase">
            Realtors
          </span>
        </Link>

        <SiteSearch className="hidden min-w-0 flex-1 md:block" />

        {/* Desktop Animated Switcher */}
        <AnimatedCurrencySwitcher
          options={currencyOptions}
          value={currency}
          onChange={setCurrency}
          className="hidden flex-none md:flex"
          layoutIdPrefix="desktop-currency"
        />

        {/* Mobile currency picker — all five codes, not just whichever two
            happened to fit in the segmented control. */}
        <CurrencyPicker
          options={currencyOptions}
          value={currency}
          onChange={setCurrency}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => setIsSearchOpen(true)}
          // Also added rounded-xl to this icon button to maintain the consistent styling rule
          className="cl-btn cl-btn-secondary cl-btn-icon size-11 flex-none rounded-xl md:hidden"
          title="Search"
          aria-label="Search listings"
        >
          <Search size={14} strokeWidth={2} />
        </motion.button>

        <ButtonLink
          href="/system/valuation-requests"
          variant="primary"
          className="hidden flex-none gap-1.75 transition-transform hover:scale-[1.02] active:scale-95 md:inline-flex"
        >
          <TrendingUp size={14} />
          Sell or value
        </ButtonLink>

        <ButtonLink
          href="/system/valuation-requests"
          variant="primary"
          size="icon"
          className="size-11 flex-none transition-transform hover:scale-105 active:scale-95 md:hidden"
          title="Sell or value"
        >
          <TrendingUp size={14} />
        </ButtonLink>
      </motion.header>

      <ThemeToggle />

      <MobileSearchDialog
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  )
}
