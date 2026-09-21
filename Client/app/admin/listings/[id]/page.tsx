"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Pad } from "../../../_components/Admin/admin-shell"
import { BackIcon } from "../../../_components/Admin/icons"
import {
  ActivityLine,
  K,
  Pair,
  SectionHead,
} from "../../../_components/Admin/ui"
import { PageIn } from "../../../_components/Admin/motion"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useViewingContext } from "../../../_lib/Context/Viewing Request"
import { useLogsContext } from "../../../_lib/Context/Audit"
import type { ListingWithMedia } from "../../../_lib/Types/Listing"
import { dateLabel } from "../_lib"
import { ListingForm } from "../_components/listing-form"

export default function AdminListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { fetchListing } = useListingContext(),
    { leads } = useLeadContext(),
    { viewingRequests } = useViewingContext(),
    { logs } = useLogsContext()

  const [listing, setListing] = React.useState<
    ListingWithMedia | null | undefined
  >(undefined)

  React.useEffect(() => {
    let cancelled = false
    fetchListing(id)
      .then((l) => {
        if (!cancelled) setListing(l)
      })
      .catch(() => {
        if (!cancelled) setListing(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (listing === undefined) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
        Loading…
      </div>
    )
  }

  if (listing === null) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
        Listing not found.
      </div>
    )
  }

  const listingLeads = leads.filter((l) => l.listing_id === listing.id),
    listingViewings = viewingRequests.filter(
      (v) => v.listing_id === listing.id
    ),
    activity = logs
      .filter((l) => l.entity_type === "Listing" && l.entity_id === listing.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6)

  return (
    <PageIn>
      <div className="flex items-center gap-3 border-b border-(--color-divider) px-4 py-3.5 md:px-7">
        <ButtonLink
          href="/admin/listings"
          variant="secondary"
          size="icon"
          className="h-8.5 w-8.5 flex-none"
          aria-label="Back to listings"
        >
          <BackIcon size={16} />
        </ButtonLink>
        <K className="cl-fig min-w-0 flex-1 truncate">
          {listing.reference_code}
        </K>
        {listing.status === "published" ? (
          <ButtonLink
            href={`/system/listings/${listing.slug}`}
            variant="secondary"
          >
            View public page
          </ButtonLink>
        ) : null}
      </div>

      <div className="grid gap-0 md:grid-cols-2 md:gap-x-7">
        <Pad className="pt-4">
          <SectionHead>Performance</SectionHead>
          <Pair label="Views">{listing.view_count.toLocaleString()}</Pair>
          <Pair label="Enquiries">{listingLeads.length}</Pair>
          <Pair label="Viewings booked">{listingViewings.length}</Pair>
          <Pair label="Published">
            {listing.published_at
              ? dateLabel(listing.published_at)
              : "Not yet published"}
          </Pair>
        </Pad>

        <Pad className="pt-4">
          <SectionHead>Activity</SectionHead>
          {activity.length === 0 ? (
            <div className="mt-3 text-[13px] text-neutral-600">
              No recorded activity for this listing yet.
            </div>
          ) : (
            <div className="mt-3.5 flex flex-col gap-3">
              {activity.map((log) => (
                <ActivityLine key={log.id} date={dateLabel(log.created_at)}>
                  {log.action}
                </ActivityLine>
              ))}
            </div>
          )}
          <Link href="/admin/audit-log" className="cl-k mt-3.5 inline-block">
            The whole ledger →
          </Link>
        </Pad>
      </div>

      <div className="mt-4.5 border-t border-(--color-divider)">
        <ListingForm listing={listing} />
      </div>
    </PageIn>
  )
}
