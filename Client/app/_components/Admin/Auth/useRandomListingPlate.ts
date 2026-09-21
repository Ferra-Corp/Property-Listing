"use client"

import * as React from "react"
import type { ListingWithThumbnail } from "../../../_lib/Types/Listing"

export type ListingPlate = {
  src: string
  alt: string
  caption: string
}

/**
 * The auth screens' left pane used a hand-written placeholder caption
 * ("Photograph · the firm's staircase..."). Real photography exists on the
 * public listings — `/system/api/v1/listing` needs no session, so an
 * unauthenticated visitor on a sign-in screen can hit it exactly like the
 * public site does. Picks one listing with a photo at random each time an
 * auth page mounts; returns null (falling back to the static placeholder
 * caption each page already passes) while loading, on a network hiccup, or
 * if nothing published has a photo yet.
 */
export function useRandomListingPlate(): ListingPlate | null {
  const [plate, setPlate] = React.useState<ListingPlate | null>(null)

  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const listingsRequest = await fetch("/system/api/v1/listing"),
          listings: ListingWithThumbnail[] = listingsRequest.ok
            ? await listingsRequest.json()
            : []

        const withPhotos = listings.filter(
          (listing) => listing.status === "published" && listing.thumbnail_url
        )

        if (cancelled || withPhotos.length === 0) return

        const pick = withPhotos[Math.floor(Math.random() * withPhotos.length)]

        setPlate({
          src: pick.thumbnail_url as string,
          alt: pick.title,
          caption: pick.location_label
            ? `${pick.title} · ${pick.location_label}`
            : pick.title,
        })
      } catch {
        // Network hiccup — the shell just keeps its placeholder caption.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return plate
}
