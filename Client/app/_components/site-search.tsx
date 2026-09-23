"use client"

import * as React from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "./ui/field"
import { useListingContext } from "../_lib/Context/Listing"
import { searchListings } from "../_lib/searchListings"

const MAX_SUGGESTIONS = 6

/**
 * YouTube-style search: typing shows an inline dropdown of matching
 * listings — press one to go straight to it, or see "No such property
 * found". Never redirects to the listings register on its own; that page
 * still has its own independent search box for browsing/filtering.
 */
export function SiteSearch({ className }: { className?: string }) {
  const { listings } = useListingContext(),
    [query, setQuery] = React.useState(""),
    [open, setOpen] = React.useState(false),
    trimmed = query.trim(),
    results = searchListings(listings, trimmed, MAX_SUGGESTIONS)

  const select = () => {
    setOpen(false)
    setQuery("")
  }

  return (
    <div className={"relative " + (className ?? "")}>
      <label className="flex min-h-9 items-center gap-2 rounded-(--cl-radius-md) border border-(--color-divider) px-3 text-neutral-600">
        <Search size={14} strokeWidth={2} className="flex-none" />
        <Input
          placeholder="Search go-downs, offices, Karen, Westlands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur()
            if (e.key === "Enter" && results[0]) {
              window.location.href = `/system/listings/${results[0].slug}`
            }
          }}
          className="min-h-0 border-0 p-0 text-[13px] focus:outline-none"
        />
      </label>

      {open && trimmed ? (
        <div className="absolute top-10.5 left-0 z-30 w-full min-w-70 overflow-hidden rounded-(--cl-radius-md) border border-(--color-divider) bg-(--color-bg) shadow-(--shadow-md)">
          {results.length > 0 ? (
            results.map((listing) => (
              <Link
                key={listing.id}
                href={`/system/listings/${listing.slug}`}
                onClick={select}
                className="hover:bg-neutral-100) flex items-center justify-between gap-3 border-b border-(--color-divider) px-3 py-2.5 text-[13px] text-(--color-text) last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate">{listing.title}</div>
                  <div className="cl-fig cl-k text-neutral-600) mt-0.5 truncate">
                    {listing.location_label} · {listing.reference_code}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-neutral-600) px-3 py-3 text-[13px]">
              No such property found.
            </div>
          )}
          <Link
            href="/system/listings"
            onClick={select}
            className="bg-neutral-100) hover:bg-neutral-200) block px-3 py-2.5 text-center text-[12.5px] text-(--color-accent-700)"
          >
            View all listings →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
