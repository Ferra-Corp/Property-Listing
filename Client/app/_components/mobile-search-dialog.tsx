"use client"

import * as React from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useListingContext } from "../_lib/Context/Listing"
import { searchListings } from "../_lib/searchListings"

const MAX_RESULTS = 20

/**
 * The mobile counterpart to SiteSearch's inline dropdown: same matching
 * logic, but as its own small overlay — a search field up top, results
 * scrolling underneath, everything else on the page dimmed and blurred
 * behind it — since there's no room to dock a results dropdown under a
 * header field on a phone-width screen.
 */
export function MobileSearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { listings } = useListingContext(),
    [query, setQuery] = React.useState(""),
    inputRef = React.useRef<HTMLInputElement>(null),
    trimmed = query.trim(),
    results = searchListings(listings, trimmed, MAX_RESULTS)

  // Reset on the way out, not the way in — so it doesn't flash empty right
  // as the close animation starts.
  React.useEffect(() => {
    if (!open) return
    setQuery("")
    // Autofocus fires before the open animation finishes on some mobile
    // browsers otherwise, which can scroll the page oddly mid-transition.
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <React.Fragment>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label="Search listings"
            className="fixed top-16 right-3 left-3 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-(--color-divider) bg-(--color-bg) shadow-(--shadow-lg) md:hidden"
          >
            <label className="flex flex-none items-center gap-2 border-b border-(--color-divider) px-3.5 py-3">
              <Search size={16} strokeWidth={2} className="flex-none text-neutral-600" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search go-downs, offices, Karen, Westlands…"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-(--color-text) outline-none placeholder:text-neutral-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) {
                    window.location.href = `/system/listings/${results[0].slug}`
                  }
                }}
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="flex size-7 flex-none items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-(--color-text)"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </label>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {trimmed ? (
                results.length > 0 ? (
                  results.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/system/listings/${listing.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 border-b border-(--color-divider) px-3.5 py-3 text-(--color-text) last:border-b-0 active:bg-neutral-100"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px]">
                          {listing.title}
                        </div>
                        <div className="cl-fig cl-k mt-0.5 truncate text-neutral-600">
                          {listing.location_label} · {listing.reference_code}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-3.5 py-6 text-center text-[13px] text-neutral-600">
                    No such property found.
                  </div>
                )
              ) : (
                <div className="px-3.5 py-6 text-center text-[13px] text-neutral-600">
                  Start typing to search listings.
                </div>
              )}
            </div>

            <Link
              href="/system/listings"
              onClick={onClose}
              className="flex-none border-t border-(--color-divider) bg-neutral-100 px-3.5 py-3 text-center text-[12.5px] font-medium text-(--color-accent-700)"
            >
              View all listings →
            </Link>
          </motion.div>
        </React.Fragment>
      ) : null}
    </AnimatePresence>
  )
}
