"use client"

import * as React from "react"
import type { ListingWithThumbnail } from "../../../_lib/Types/Listing"
import type { AgentProfile } from "../../../_lib/Types/Agent"
import type { Testimonial } from "../../../_lib/Types/Testimonial"

export type AuthPublicData = {
  listings: ListingWithThumbnail[]
  agents: AgentProfile[]
  testimonials: Testimonial[]
}

/**
 * /admin/auth has no data contexts mounted (PublicDataProviders skips it —
 * there is no session and most of those contexts aren't needed), but the
 * listings, agents and testimonials endpoints are public and need none. This
 * reads just those three, once per page load, and is shared by everything on
 * the auth screens that wants real figures (the photo plate, the counts, the
 * quote). Each read fails independently to an empty list, so one endpoint
 * being down never blanks the others.
 */
let pending: Promise<AuthPublicData> | null = null

async function readList<T>(url: string): Promise<T[]> {
  try {
    const request = await fetch(url)
    if (!request.ok) return []
    const response = await request.json()
    return Array.isArray(response) ? (response as T[]) : []
  } catch {
    return []
  }
}

export function loadAuthPublicData(): Promise<AuthPublicData> {
  pending ??= Promise.all([
    readList<ListingWithThumbnail>("/system/api/v1/listing"),
    readList<AgentProfile>("/system/api/v1/agents"),
    readList<Testimonial>("/system/api/v1/testimonials"),
  ]).then(([listings, agents, testimonials]) => ({
    listings,
    agents,
    testimonials,
  }))

  return pending
}

export type AuthStats = {
  ready: boolean
  publishedListings: number
  agents: number
  /** One active testimonial picked at random, or null if there are none. */
  testimonial: Testimonial | null
}

export function useAuthStats(): AuthStats {
  const [stats, setStats] = React.useState<AuthStats>({
    ready: false,
    publishedListings: 0,
    agents: 0,
    testimonial: null,
  })

  React.useEffect(() => {
    let cancelled = false

    loadAuthPublicData().then(({ listings, agents, testimonials }) => {
      if (cancelled) return

      setStats({
        ready: true,
        publishedListings: listings.filter((l) => l.status === "published")
          .length,
        agents: agents.filter((a) => a.is_active).length,
        testimonial:
          testimonials.length > 0
            ? testimonials[Math.floor(Math.random() * testimonials.length)]
            : null,
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return stats
}
