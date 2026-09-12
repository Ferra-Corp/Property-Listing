"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { ButtonLink } from "../../_components/ui/button"
import { Input, Select } from "../../_components/ui/field"
import { FilterChip } from "../../_components/ui/filters"
import {
  EMPTY_LISTING_FILTERS,
  FilterRail,
  type FilterOption,
  type ListingFilters,
} from "./_components/filter-rail"
import {
  ListingRow,
  toRowListing,
  useCurrencyConversion,
} from "./_components/listing-row"
import { useListingContext } from "../../_lib/Context/Listing"
import { useListingSearch } from "../../_lib/useListingSearch"
import type {
  ListingPurpose,
  ListingWithThumbnail,
  PropertyType,
} from "../../_lib/Types/Listing"

const VALID_PURPOSES: ListingPurpose[] = ["sale", "rent", "lease"]
const VALID_CATEGORIES: PropertyType[] = [
  "residential",
  "commercial",
  "industrial",
  "land",
]

function parsePurpose(value: string | null): ListingPurpose | null {
  return VALID_PURPOSES.includes(value as ListingPurpose)
    ? (value as ListingPurpose)
    : null
}

function parseCategory(value: string | null): PropertyType[] {
  return VALID_CATEGORIES.includes(value as PropertyType)
    ? [value as PropertyType]
    : []
}

function parseSubtype(value: string | null): string[] {
  if (!value) return []
  return value.split(",").filter((v) => v in SUBTYPE_LABEL)
}

function parseLocation(value: string | null): string[] {
  return value ? [value] : []
}

const CATEGORY_LABEL: Record<PropertyType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  land: "Land",
}

const SUBTYPE_LABEL: Record<string, string> = {
  apartment: "Apartment",
  townhouse: "Townhouse",
  villa: "Villa",
  maisonette: "Maisonette",
  bungalow: "Bungalow",
  studio: "Studio",
  office: "Office",
  retail: "Retail",
  shop: "Shop",
  showroom: "Showroom",
  mixed_use: "Mixed use",
  go_down: "Go-down",
  warehouse: "Warehouse",
  industrial_park: "Industrial park unit",
  yard: "Yard / hardstanding",
  plot: "Plot",
  farm: "Farm",
  development_site: "Development site",
}

const SORT_OPTIONS = [
  "Newest first",
  "Rate, low to high",
  "Rate, high to low",
  "Size, largest first",
] as const

type Sort = (typeof SORT_OPTIONS)[number]

const PAGE_SIZE = 10

/** Windowed page numbers: first, last, current ±1, "…" for the gaps. */
function pageNumbers(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const result: (number | "…")[] = []
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push("…")
    result.push(p)
  })
  return result
}

function matchesSearch(listing: ListingWithThumbnail, query: string): boolean {
  if (!query.trim()) return true
  const haystack =
    `${listing.title} ${listing.location_label} ${listing.reference_code}`.toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}

function ListingsIndexContent() {
  const { listings } = useListingContext(),
    convertTo = useCurrencyConversion(),
    { query: search, setQuery: setSearch } = useListingSearch(),
    searchParams = useSearchParams(),
    purposeParam = searchParams.get("purpose"),
    typeParam = searchParams.get("type"),
    subtypeParam = searchParams.get("subtype"),
    locationParam = searchParams.get("location"),
    [filters, setFilters] = React.useState<ListingFilters>(() => ({
      ...EMPTY_LISTING_FILTERS,
      purpose: parsePurpose(purposeParam),
      category: parseCategory(typeParam),
      unitTypes: parseSubtype(subtypeParam),
      locations: parseLocation(locationParam),
    })),
    [sort, setSort] = React.useState<Sort>("Newest first"),
    [page, setPage] = React.useState(1),
    listRef = React.useRef<HTMLDivElement>(null)

  const updateFilters = (patch: Partial<ListingFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))

  // A different filter/search/sort means a different result set — always
  // start back at page one rather than stranding the reader on, say, page 4
  // of a set that may no longer have one. Adjusted during render (React's
  // documented pattern for this) rather than in an effect, so it takes
  // effect before the stale page renders instead of after.
  const resetKey = JSON.stringify(filters) + "|" + search + "|" + sort
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setPage(1)
  }

  const goToPage = (target: number) => {
    setPage(target)
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // The site header links here with `?purpose=`/`?type=` — since navigating
  // between header links keeps this page mounted (only the query changes),
  // a plain useState initializer only covers the first load.
  const isFirstRender = React.useRef(true)
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setFilters((current) => ({
      ...current,
      purpose: parsePurpose(purposeParam),
      category: parseCategory(typeParam),
      unitTypes: parseSubtype(subtypeParam),
      locations: parseLocation(locationParam),
    }))
  }, [purposeParam, typeParam, subtypeParam, locationParam])

  const categoryOptions: FilterOption[] = React.useMemo(() => {
      const counts = new Map<PropertyType, number>()
      for (const listing of listings) {
        counts.set(
          listing.property_type,
          (counts.get(listing.property_type) ?? 0) + 1
        )
      }
      return Array.from(counts, ([value, count]) => ({
        value,
        label: CATEGORY_LABEL[value] ?? value,
        count,
      })).sort((a, b) => b.count - a.count)
    }, [listings]),
    unitTypeOptions: FilterOption[] = React.useMemo(() => {
      const counts = new Map<string, number>()
      for (const listing of listings) {
        if (!listing.property_subtype) continue
        counts.set(
          listing.property_subtype,
          (counts.get(listing.property_subtype) ?? 0) + 1
        )
      }
      return Array.from(counts, ([value, count]) => ({
        value,
        label: SUBTYPE_LABEL[value] ?? value,
        count,
      })).sort((a, b) => b.count - a.count)
    }, [listings]),
    locationOptions: FilterOption[] = React.useMemo(() => {
      const counts = new Map<string, number>()
      for (const listing of listings) {
        const key = listing.city ?? listing.location_label
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      return Array.from(counts, ([value, count]) => ({
        value,
        label: value,
        count,
      })).sort((a, b) => b.count - a.count)
    }, [listings]),
    exclusiveCount = listings.filter((l) => l.is_exclusive).length

  const filtered = React.useMemo(() => {
    return listings.filter((listing) => {
      if (!matchesSearch(listing, search)) return false
      if (filters.purpose && listing.purpose !== filters.purpose) return false
      if (
        filters.category.length > 0 &&
        !filters.category.includes(listing.property_type)
      )
        return false
      if (
        filters.unitTypes.length > 0 &&
        !filters.unitTypes.includes(listing.property_subtype ?? "")
      )
        return false
      if (
        filters.locations.length > 0 &&
        !filters.locations.includes(listing.city ?? listing.location_label)
      )
        return false
      if (
        filters.floorAreaMin &&
        (!listing.floor_area ||
          Number(listing.floor_area) < Number(filters.floorAreaMin))
      )
        return false
      if (
        filters.floorAreaMax &&
        (!listing.floor_area ||
          Number(listing.floor_area) > Number(filters.floorAreaMax))
      )
        return false
      if (
        filters.priceMin &&
        (!listing.price || Number(listing.price) < Number(filters.priceMin))
      )
        return false
      if (
        filters.priceMax &&
        (!listing.price || Number(listing.price) > Number(filters.priceMax))
      )
        return false
      if (filters.exclusiveOnly && !listing.is_exclusive) return false
      return true
    })
  }, [listings, filters, search])

  const sorted = React.useMemo(() => {
    const list = [...filtered]
    switch (sort) {
      case "Rate, low to high":
        return list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
      case "Rate, high to low":
        return list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
      case "Size, largest first":
        return list.sort(
          (a, b) => Number(b.floor_area ?? 0) - Number(a.floor_area ?? 0)
        )
      default:
        return list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
    currentPage = Math.min(page, pageCount),
    pageStart = (currentPage - 1) * PAGE_SIZE,
    paged = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  const rows = paged.map((listing) => toRowListing(listing, convertTo))

  const appliedChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(filters.purpose
      ? [
          {
            key: "purpose",
            label:
              filters.purpose === "lease"
                ? "Lease"
                : filters.purpose === "rent"
                  ? "Rent"
                  : "Buy",
            onRemove: () => updateFilters({ purpose: null }),
          },
        ]
      : []),
    ...filters.category.map((value) => ({
      key: `category-${value}`,
      label: CATEGORY_LABEL[value] ?? value,
      onRemove: () =>
        updateFilters({
          category: filters.category.filter((v) => v !== value),
        }),
    })),
    ...filters.unitTypes.map((value) => ({
      key: `unit-${value}`,
      label: SUBTYPE_LABEL[value] ?? value,
      onRemove: () =>
        updateFilters({
          unitTypes: filters.unitTypes.filter((v) => v !== value),
        }),
    })),
    ...filters.locations.map((value) => ({
      key: `loc-${value}`,
      label: value,
      onRemove: () =>
        updateFilters({
          locations: filters.locations.filter((v) => v !== value),
        }),
    })),
    ...(filters.exclusiveOnly
      ? [
          {
            key: "exclusive",
            label: "Exclusive only",
            onRemove: () => updateFilters({ exclusiveOnly: false }),
          },
        ]
      : []),
    ...(filters.floorAreaMin || filters.floorAreaMax
      ? [
          {
            key: "area",
            label: `${filters.floorAreaMin || "0"}–${filters.floorAreaMax || "∞"} sq ft`,
            onRemove: () =>
              updateFilters({ floorAreaMin: "", floorAreaMax: "" }),
          },
        ]
      : []),
    ...(filters.priceMin || filters.priceMax
      ? [
          {
            key: "price",
            label: `Price ${filters.priceMin || "0"}–${filters.priceMax || "∞"}`,
            onRemove: () => updateFilters({ priceMin: "", priceMax: "" }),
          },
        ]
      : []),
    ...(search.trim()
      ? [
          {
            key: "search",
            label: `“${search.trim()}”`,
            onRemove: () => setSearch(""),
          },
        ]
      : []),
  ]

  const resetAll = () => {
    setFilters(EMPTY_LISTING_FILTERS)
    setSearch("")
  }

  const closeSheet = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open")
  }

  return (
    <>
      {/* ── Masthead ── */}
      <section className="px-4 pt-5 md:px-10 md:pt-6.5">
        {/* mobile-only query field — desktop carries it in the head bar */}
        <label className="flex items-center gap-2 rounded-(--cl-radius-md) border border-(--color-divider) px-3 text-neutral-600 md:hidden">
          <Search size={14} strokeWidth={2} className="flex-none" />
          <Input
            placeholder="Search listings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-9.5 border-0 p-0 text-[13px]"
          />
        </label>

        <div className="cl-k mt-4 text-neutral-600 md:mt-0">Listings</div>
        <div className="mt-2 flex flex-col gap-2 border-b-2 border-(--color-text) pb-3 md:mt-3 md:flex-row md:items-end md:justify-between md:gap-7.5 md:pb-3.5">
          <h1 className="m-0 max-w-[26ch] text-[27px] leading-[1.15] font-normal md:text-[40px] md:leading-[1.1]">
            Commercial &amp; residential listings, Nairobi metropolitan area
          </h1>
          <div className="cl-fig cl-mono flex-none text-[11.5px] text-neutral-600 md:text-right md:text-[12px]">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-10 px-4 pt-4 md:grid-cols-[246px_1fr] md:px-10 md:pt-5.5">
        {/* ── Refine rail — desktop ── */}
        <aside className="sticky top-20 hidden md:flex md:flex-col">
          <FilterRail
            filters={filters}
            onChange={updateFilters}
            onReset={resetAll}
            categoryOptions={categoryOptions}
            unitTypeOptions={unitTypeOptions}
            locationOptions={locationOptions}
            exclusiveCount={exclusiveCount}
            resultCount={sorted.length}
          />
        </aside>

        <div>
          {/* applied filters */}
          {appliedChips.length > 0 ? (
            <div className="-mx-4 flex scrollbar-none items-center gap-2 overflow-x-auto px-4 py-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:py-0">
              {appliedChips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  label={chip.label}
                  onRemove={chip.onRemove}
                />
              ))}
              <button
                type="button"
                onClick={resetAll}
                className="ml-1 hidden text-[12px] md:inline"
              >
                Clear
              </button>
            </div>
          ) : null}

          {/* count + sort */}
          <div className="mt-3.5 hidden items-center justify-between gap-4 border-b border-(--color-divider) pb-2.5 md:flex">
            <div className="cl-fig text-neutral-700) text-[13px]">
              Showing{" "}
              <span className="text-(--color-text)">
                {sorted.length === 0 ? 0 : pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, sorted.length)}
              </span>{" "}
              of {sorted.length}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="cl-k text-neutral-600">Sort</span>
              <Select
                className="w-46.5 text-[13px]"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* the register */}
          <div ref={listRef} className="scroll-mt-24">
            {rows.length === 0 ? (
              <div className="border-t border-(--color-divider) py-10 text-center text-[13.5px] text-neutral-600">
                No listings match these filters.
              </div>
            ) : (
              <div className="mt-1 border-t border-(--color-divider) md:mt-0 md:border-t-0">
                {rows.map((listing, index) => (
                  <ListingRow
                    key={listing.slug}
                    listing={listing}
                    last={index === rows.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {pageCount > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-(--color-divider) pt-4 md:mt-7">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="cl-fig text-[13px] text-(--color-text) disabled:pointer-events-none disabled:text-neutral-500"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1.5">
                {pageNumbers(currentPage, pageCount).map((entry, index) =>
                  entry === "…" ? (
                    <span
                      key={`gap-${index}`}
                      className="cl-fig px-1 text-[13px] text-neutral-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => goToPage(entry)}
                      aria-current={entry === currentPage ? "page" : undefined}
                      className={
                        "cl-fig flex size-7 items-center justify-center rounded-(--cl-radius-sm) text-[13px] transition-colors" +
                        (entry === currentPage
                          ? " border border-(--color-text) text-(--color-text)"
                          : " text-neutral-600 hover:text-(--color-text)")
                      }
                    >
                      {entry}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                className="cl-fig text-[13px] text-(--color-text) disabled:pointer-events-none disabled:text-neutral-500"
              >
                Next →
              </button>
            </div>
          ) : null}

          {/* requirement catch ── */}
          <div className="mt-6 grid items-center gap-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-100 p-4 md:mt-7 md:grid-cols-[1fr_260px] md:gap-8 md:p-5">
            <div>
              <h4 className="mb-0 text-[19px] font-normal md:text-[21px]">
                Nothing here fits?
              </h4>
              <p className="mt-2 mb-0 max-w-[58ch] text-[13px] leading-[1.7] text-neutral-700">
                Send us the specification — clear span, eaves height, power,
                access — and we will search off-market stock and come back with
                a shortlist. No account needed.
              </p>
            </div>
            <ButtonLink href="/system/contact" variant="primary" block>
              Send a requirement
            </ButtonLink>
          </div>

          {/* geo footnote for the landing pages */}
          <div className="py-6 md:pt-6.5 md:pb-8.5">
            <div className="cl-k text-neutral-600">
              About the Nairobi market
            </div>
            <p className="mt-2.5 mb-0 text-[13px] leading-[1.75] [hyphens:auto] text-neutral-700 md:text-justify">
              Rates and prices vary sharply by corridor and building
              specification — read our latest notes for what tenants and buyers
              are actually paying, by area.
            </p>
            <div className="mt-3 flex flex-wrap gap-3.5">
              <Link href="/system/insights" className="text-[13px]">
                Browse market insights →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter sheet + sort — small screens ── */}
      <div className="sticky bottom-16 z-10 flex items-center gap-2 border-t border-(--color-divider) bg-(--color-bg) px-4 py-2.5 md:hidden">
        <details className="relative flex-1">
          <summary className="cl-btn cl-btn-primary cl-btn-block m-0 list-none">
            Filter
            {appliedChips.length > 0 ? ` · ${appliedChips.length} applied` : ""}
          </summary>
          <div className="absolute right-0 bottom-11 left-0 max-h-107.5 overflow-auto rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) p-3.5 shadow-(--shadow-lg)">
            <FilterRail
              compact
              filters={filters}
              onChange={updateFilters}
              onReset={resetAll}
              categoryOptions={categoryOptions}
              unitTypeOptions={unitTypeOptions}
              locationOptions={locationOptions}
              exclusiveCount={exclusiveCount}
              resultCount={sorted.length}
              onDone={closeSheet}
            />
          </div>
        </details>
        <Select
          className="w-35 flex-none text-[12.5px]"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
      </div>
    </>
  )
}

export default function ListingsIndexPage() {
  return (
    <React.Suspense fallback={null}>
      <ListingsIndexContent />
    </React.Suspense>
  )
}
