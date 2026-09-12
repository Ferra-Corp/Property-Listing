"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

const LISTINGS_PATH = "/system/listings"

/**
 * The listings search term, backed by the `?q=` URL param rather than local
 * component state — so the header's search box and the listings page's own
 * search box (two separate components) both read and write the same value.
 * Reads as empty everywhere except the listings page itself.
 */
export function useListingSearch() {
  const router = useRouter(),
    pathname = usePathname(),
    searchParams = useSearchParams(),
    onListingsPage = pathname === LISTINGS_PATH,
    query = onListingsPage ? (searchParams.get("q") ?? "") : ""

  const setQuery = (value: string) => {
    const params = new URLSearchParams(onListingsPage ? searchParams.toString() : "")

    if (value) params.set("q", value)
    else params.delete("q")

    const search = params.toString(),
      url = `${LISTINGS_PATH}${search ? `?${search}` : ""}`

    if (onListingsPage) router.replace(url, { scroll: false })
    else router.push(url)
  }

  return { query, setQuery }
}
