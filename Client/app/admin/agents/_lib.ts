import type { AgentProfile } from "../../_lib/Types/Agent"
import type { ListingWithThumbnail } from "../../_lib/Types/Listing"
import type { Lead } from "../../_lib/Types/Lead"
import type { ViewingRequest } from "../../_lib/Types/Viewing Request"
import type { ValuationRequest } from "../../_lib/Types/Valuation Request"
import type { UserRole } from "../../_lib/Types/User"

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  agent: "Agent",
  editor: "Editor",
  viewer: "Viewer",
}

/** Matches the tag treatment used for specializations/patch elsewhere. */
export const ROLE_TAG_CLASS: Record<UserRole, string> = {
  admin: "cl-tag-accent-2",
  agent: "cl-tag-accent",
  editor: "cl-tag-neutral",
  viewer: "cl-tag-outline",
}

export function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("")
}

/** Every listing this agent currently holds the mandate on. */
export function listingsFor(
  agent: AgentProfile,
  listings: ListingWithThumbnail[]
): ListingWithThumbnail[] {
  return listings.filter((l) => l.agent_id === agent.user_id)
}

/** Real coverage, derived from where their own mandates actually are —
 * there is no separate "patch" field on file. */
export function patchFor(
  agent: AgentProfile,
  listings: ListingWithThumbnail[]
): string[] {
  const cities = new Set(
    listingsFor(agent, listings).map((l) => l.city ?? l.location_label)
  )
  return Array.from(cities)
}

const OPEN_LEAD_STATUSES = new Set([
  "new",
  "contacted",
  "qualified",
  "viewing_booked",
  "negotiating",
])

export function openLeadsFor(agent: AgentProfile, leads: Lead[]): Lead[] {
  return leads.filter(
    (l) => l.assigned_agent_id === agent.user_id && OPEN_LEAD_STATUSES.has(l.status)
  )
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function viewingsThisWeekFor(
  agent: AgentProfile,
  viewings: ViewingRequest[]
): ViewingRequest[] {
  const start = startOfWeek(new Date()),
    end = new Date(start)
  end.setDate(start.getDate() + 7)

  return viewings.filter((v) => {
    if (v.assigned_agent_id !== agent.user_id) return false
    if (v.status === "cancelled") return false
    const date = new Date(v.preferred_date)
    return date >= start && date < end
  })
}

export function openValuationsFor(
  agent: AgentProfile,
  valuations: ValuationRequest[]
): ValuationRequest[] {
  return valuations.filter(
    (v) =>
      v.assigned_agent_id === agent.user_id &&
      (v.status === "pending" || v.status === "confirmed")
  )
}
