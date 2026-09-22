"use client"

import * as React from "react"
import Link from "next/link"
import { Button, ButtonLink } from "../../_components/ui/button"
import { Select } from "../../_components/ui/field"
import { Plate } from "../../_components/ui/plate"
import { PageHead, Pad, Toolbar } from "../../_components/Admin/admin-shell"
import { PlusIcon } from "../../_components/Admin/icons"
import { Chip, K, Status, Td, Th, Tr } from "../../_components/Admin/ui"
import { useToast } from "../../_components/Admin/motion"
import { useListingContext } from "../../_lib/Context/Listing"
import { useAgentContext } from "../../_lib/Context/Agent"
import { usePermission } from "../../_lib/permissions"
import type { ListingStatus, PropertyType } from "../../_lib/Types/Listing"
import {
  dateLabel,
  PROPERTY_TYPE_LABEL,
  priceLabel,
  STATUS_LABEL,
  STATUS_TONE,
} from "./_lib"

const STATE_FILTERS = [
  "All",
  "Published",
  "Draft",
  "Pending review",
  "Archived",
] as const

/** "Archived" on the desk covers every status a listing leaves the active
 * pipeline into — there's no single `archived` value in the schema. */
function inStateFilter(
  status: ListingStatus,
  filter: (typeof STATE_FILTERS)[number]
): boolean {
  if (filter === "All") return true
  if (filter === "Published") return status === "published"
  if (filter === "Draft") return status === "draft"
  if (filter === "Pending review") return status === "pending_review"
  return ["under_offer", "sold", "rented", "withdrawn"].includes(status)
}

export default function AdminListingsPage() {
  const { listings, loading, editListing, deleteListing } = useListingContext(),
    { agents } = useAgentContext(),
    canEdit = usePermission("Edit listing"),
    canDelete = usePermission("Delete listing"),
    push = useToast(),
    [stateFilter, setStateFilter] =
      React.useState<(typeof STATE_FILTERS)[number]>("All"),
    [typeFilter, setTypeFilter] = React.useState(""),
    [purposeFilter, setPurposeFilter] = React.useState(""),
    [agentFilter, setAgentFilter] = React.useState(""),
    [sort, setSort] = React.useState<"edited" | "ref" | "views">("edited"),
    [query, setQuery] = React.useState(""),
    [selected, setSelected] = React.useState<Set<string>>(new Set())

  const agentName = (userId: string) =>
    agents.find((a) => a.user_id === userId)?.display_name ?? "Unassigned"

  const filtered = listings.filter((l) => {
    if (!inStateFilter(l.status, stateFilter)) return false
    if (typeFilter && l.property_type !== typeFilter) return false
    if (purposeFilter && l.purpose !== purposeFilter) return false
    if (agentFilter && l.agent_id !== agentFilter) return false
    if (query.trim()) {
      const haystack =
        `${l.reference_code} ${l.title} ${l.location_label}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "ref") return a.reference_code.localeCompare(b.reference_code)
    if (sort === "views") return b.view_count - a.view_count
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const counts = {
    published: listings.filter((l) => l.status === "published").length,
    draft: listings.filter((l) => l.status === "draft").length,
    pending: listings.filter((l) => l.status === "pending_review").length,
    archived: listings.filter((l) =>
      ["under_offer", "sold", "rented", "withdrawn"].includes(l.status)
    ).length,
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkSetStatus(status: ListingStatus) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => editListing(id, { status })))
      push({
        title: `${ids.length} listing${ids.length === 1 ? "" : "s"} moved to ${STATUS_LABEL[status].toLowerCase()}`,
      })
      setSelected(new Set())
    } catch (error) {
      push({
        title: "Couldn't update those listings",
        body: (error as Error).message,
      })
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (
      !window.confirm(
        `Delete ${ids.length} listing${ids.length === 1 ? "" : "s"}? This can't be undone.`
      )
    )
      return
    try {
      await Promise.all(ids.map((id) => deleteListing(id)))
      push({
        title: `${ids.length} listing${ids.length === 1 ? "" : "s"} deleted`,
      })
      setSelected(new Set())
    } catch (error) {
      push({
        title: "Couldn't delete those listings",
        body: (error as Error).message,
      })
    }
  }

  return (
    <>
      <PageHead
        title="Listings"
        meta={`${listings.length} total · ${counts.published} published · ${counts.draft} draft · ${counts.pending} pending review · ${counts.archived} archived`}
        search="Reference, title or location"
      >
        <ButtonLink
          href="/admin/listings/new"
          variant="primary"
          className="gap-1.75"
        >
          <PlusIcon size={14} />
          New listing
        </ButtonLink>
      </PageHead>

      <div className="px-4 pt-4 md:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Reference, title or location"
          className="cl-input w-full text-[13.5px]"
        />
      </div>

      <Toolbar>
        <div className="cl-seg hidden flex-none md:inline-flex">
          {STATE_FILTERS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="listing-state"
                checked={stateFilter === option}
                onChange={() => setStateFilter(option)}
              />
              {option}
            </label>
          ))}
        </div>

        <div className="flex gap-1.75 overflow-x-auto md:hidden">
          {STATE_FILTERS.map((option) => (
            <Chip
              key={option}
              on={stateFilter === option}
              onClick={() => setStateFilter(option)}
            >
              {option}
            </Chip>
          ))}
        </div>

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="hidden w-42.5 flex-none text-[13px] md:block"
        >
          <option value="">All property types</option>
          {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="hidden w-37.5 flex-none text-[13px] md:block"
        >
          <option value="">Any purpose</option>
          <option value="sale">For sale</option>
          <option value="lease">To lease</option>
          <option value="rent">To rent</option>
        </Select>
        <Select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="hidden w-40 flex-none text-[13px] md:block"
        >
          <option value="">Any agent</option>
          {agents.map((a) => (
            <option key={a.id} value={a.user_id}>
              {a.display_name}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="hidden w-42.5 flex-none text-[13px] md:block"
        >
          <option value="edited">Sort · recently edited</option>
          <option value="ref">Reference code</option>
          <option value="views">Views, high to low</option>
        </Select>
        <span className="hidden flex-1 md:block" />
        <K className="hidden md:block">
          Showing {sorted.length} of {listings.length}
        </K>
      </Toolbar>

      <Pad className="hidden pt-4.5 md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {canEdit ? (
                <Th className="w-6.5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={
                      sorted.length > 0 && selected.size === sorted.length
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? new Set(sorted.map((l) => l.id))
                          : new Set()
                      )
                    }
                  />
                </Th>
              ) : null}
              <Th>Listing</Th>
              <Th className="w-30">Reference</Th>
              <Th className="w-33">State</Th>
              <Th className="w-37.5 text-right">Rate / price</Th>
              <Th className="w-24 text-right">Views</Th>
              <Th className="w-32.5">Agent</Th>
              <Th className="w-28">Edited</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((listing) => {
              const { price, priceUnit } = priceLabel(listing)
              return (
                <Tr key={listing.id}>
                  {canEdit ? (
                    <Td>
                      <input
                        type="checkbox"
                        checked={selected.has(listing.id)}
                        onChange={() => toggle(listing.id)}
                        aria-label={`Select ${listing.title}`}
                      />
                    </Td>
                  ) : null}
                  <Td>
                    <div className="flex items-start gap-3">
                      <Plate
                        matted={false}
                        src={listing.thumbnail_url}
                        alt={listing.title}
                        className="h-13 w-19 flex-none"
                        label={listing.thumbnail_url ? "" : "No plate"}
                      />
                      <div>
                        <Link
                          href={`/admin/listings/${listing.id}`}
                          className="text-[14.5px] leading-[1.35] text-(--color-text)"
                        >
                          {listing.title}
                        </Link>
                        <K className="mt-1.25">{listing.location_label}</K>
                      </div>
                    </div>
                  </Td>
                  <Td className="cl-fig cl-mono text-[11.5px]">
                    {listing.reference_code}
                  </Td>
                  <Td>
                    <Status tone={STATUS_TONE[listing.status]}>
                      {STATUS_LABEL[listing.status]}
                    </Status>
                  </Td>
                  <Td className="cl-fig text-right">
                    {price}
                    {priceUnit ? <K className="mt-1.25">{priceUnit}</K> : null}
                  </Td>
                  <Td className="cl-fig text-right">
                    {listing.view_count > 0 ? (
                      listing.view_count.toLocaleString()
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </Td>
                  <Td className="text-[13px]">{agentName(listing.agent_id)}</Td>
                  <Td className="cl-k text-neutral-600">
                    {dateLabel(listing.updated_at)}
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading ? "Loading…" : "No listings match these filters."}
          </div>
        ) : null}
      </Pad>

      <div className="mt-4 md:hidden">
        {sorted.map((listing, index) => {
          const { price, priceUnit } = priceLabel(listing)
          return (
            <Link
              key={listing.id}
              href={`/admin/listings/${listing.id}`}
              className={`grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3 border-b border-(--color-divider) px-4 py-3.5 text-(--color-text) ${
                index === 0
                  ? "bg-(--color-accent-100) shadow-[inset_3px_0_0_var(--color-accent)]"
                  : ""
              }`}
            >
              <Plate
                matted={false}
                src={listing.thumbnail_url}
                alt={listing.title}
                className="h-15 w-full"
                label={listing.thumbnail_url ? "" : "No plate"}
              />
              <div className="min-w-0">
                <div className="text-[14.5px] leading-[1.35]">
                  {listing.title}
                </div>
                <K className="mt-1.5">{listing.location_label}</K>
                <div className="mt-2.25 flex flex-wrap items-center gap-2">
                  <Status tone={STATUS_TONE[listing.status]}>
                    {STATUS_LABEL[listing.status]}
                  </Status>
                  <span className="cl-fig cl-k text-neutral-700">
                    {price}
                    {priceUnit ? ` ${priceUnit}` : ""}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
        <div className="flex items-center gap-3 px-4 py-4.5">
          <span className="cl-fig cl-k text-neutral-600">
            {sorted.length} of {listings.length}
          </span>
        </div>
      </div>

      {canEdit ? (
        <Pad className="hidden items-center gap-3.5 pt-5 pb-7 md:flex">
          <K>With selected ({selected.size})</K>
          <ButtonLink
            href="#"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("published")
            }}
          >
            Publish
          </ButtonLink>
          <ButtonLink
            href="#"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("pending_review")
            }}
          >
            Send to review
          </ButtonLink>
          <ButtonLink
            href="#"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("withdrawn")
            }}
          >
            Withdraw
          </ButtonLink>
          {canDelete ? (
            <Button
              type="button"
              variant="secondary"
              className="text-(--color-accent-2)"
              onClick={bulkDelete}
            >
              Delete
            </Button>
          ) : null}
        </Pad>
      ) : null}
    </>
  )
}
