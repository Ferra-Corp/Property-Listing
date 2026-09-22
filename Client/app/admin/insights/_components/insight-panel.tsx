"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useInsightContext } from "../../../_lib/Context/Insight"
import { useUserContext } from "../../../_lib/Context/User"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useInsightListingContext } from "../../../_lib/Context/Insight Listing"
import { usePermission } from "../../../_lib/permissions"
import type { ContentStatus } from "../../../_lib/Types/Insight"
import {
  authorFor,
  dateLabel,
  STATUS_LABEL,
  STATUS_TONE,
  subjectFor,
  wordsLabel,
} from "../_lib"

export function InsightPanel({ id }: { id: string }) {
  const { insights, loading, editInsight } = useInsightContext(),
    { users } = useUserContext(),
    { logs } = useLogsContext(),
    { listings } = useListingContext(),
    { getListingsForInsight } = useInsightListingContext(),
    canEdit = usePermission("Edit insight"),
    push = useToast(),
    router = useRouter()

  const [linkedListingIds, setLinkedListingIds] = React.useState<string[]>([])
  const [status, setStatus] = React.useState<ContentStatus | null>(null)
  const [savingStatus, setSavingStatus] = React.useState(false)
  const [lastId, setLastId] = React.useState<string | null>(null)

  const sorted = [...insights].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ),
    index = sorted.findIndex((i) => i.id === id),
    insight = sorted[index]

  if (insight && insight.id !== lastId) {
    setLastId(insight.id)
    setStatus(insight.status)
    setLinkedListingIds([])
  }

  React.useEffect(() => {
    if (!insight) return
    getListingsForInsight(insight.id)
      .then((rows) => setLinkedListingIds(rows.map((r) => r.listing_id)))
      .catch(() => setLinkedListingIds([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insight?.id])

  if (!insight) {
    return (
      <div className="px-5 py-16 text-center text-[13.5px] text-neutral-500 italic md:px-8">
        {loading ? "Loading…" : "Article not found."}
      </div>
    )
  }

  const prev = index > 0 ? sorted[index - 1] : null,
    next = index < sorted.length - 1 ? sorted[index + 1] : null,
    author = authorFor(insight, users),
    linkedListings = listings.filter((l) => linkedListingIds.includes(l.id)),
    activity = logs
      .filter((l) => l.entity_type === "Insight" && l.entity_id === insight.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6)

  async function saveStatus() {
    if (!status || status === insight.status) return
    setSavingStatus(true)
    try {
      await editInsight(insight.id, { status })
      push({ title: "Status updated", body: STATUS_LABEL[status] })
    } catch (error) {
      push({
        title: "Couldn't update the status",
        body: (error as Error).message,
      })
      setStatus(insight.status)
    } finally {
      setSavingStatus(false)
    }
  }

  const metaTitle = insight.meta_title ?? insight.title,
    metaDescription = insight.meta_description ?? insight.summary ?? ""

  return (
    <div className="min-h-full bg-(--color-bg) pb-8">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b-[1.5px] border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_90%,transparent)] px-5 py-3 backdrop-blur-md transition-all md:px-8">
        <K className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-[0.06em] text-neutral-600 uppercase">
          Article <span className="mx-1.5 opacity-40">/</span> {insight.slug}
        </K>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm transition-all hover:bg-neutral-100"
            title="Previous"
            disabled={!prev}
            onClick={() => prev && router.push(`/admin/insights/${prev.id}`)}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm transition-all hover:bg-neutral-100"
            title="Next"
            disabled={!next}
            onClick={() => next && router.push(`/admin/insights/${next.id}`)}
          >
            ↓
          </Button>
          <div className="mx-1 h-4 w-px bg-(--color-divider)" />
          <ButtonLink
            href="/admin/insights"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm transition-all hover:bg-neutral-100"
            title="Close"
          >
            ×
          </ButtonLink>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-5 pt-8 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[28px] leading-[1.15] font-medium tracking-tight text-(--color-text) md:text-[32px]">
              {insight.title}
            </h2>
            <K className="mt-3 block text-[11.5px] tracking-wide text-neutral-600 uppercase">
              <span className="font-medium text-(--color-text)">
                {author?.name ?? "No author set"}
              </span>
              <span className="mx-2 opacity-50">·</span>
              {subjectFor(insight)}
            </K>
          </div>
          <Status tone={STATUS_TONE[insight.status]} className="mt-1 shadow-sm">
            {STATUS_LABEL[insight.status]}
          </Status>
        </div>

        <div className="mt-7 flex gap-3">
          {canEdit ? (
            <ButtonLink
              href={`/admin/insights/${insight.id}/edit`}
              variant="primary"
              className="flex-1 shadow-sm"
            >
              Open the editor
            </ButtonLink>
          ) : null}
          {insight.status === "published" ? (
            <ButtonLink
              href={`/system/insights/${insight.slug}`}
              variant="secondary"
              className="flex-1 shadow-sm transition-colors hover:bg-neutral-50"
            >
              Preview
            </ButtonLink>
          ) : (
            <Button variant="secondary" className="flex-1 opacity-60" disabled>
              No public page yet
            </Button>
          )}
        </div>

        {canEdit ? (
          <div className="mt-4 flex items-center gap-3">
            <Select
              value={status ?? insight.status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="flex-1 rounded-lg text-[13.5px] shadow-sm transition-all focus:ring-2 focus:ring-neutral-300"
            >
              <option value="draft">Set state · Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
            <Button
              type="button"
              variant="primary"
              className="flex-none text-(--color-accent) shadow-sm transition-all hover:bg-(--color-accent-50)"
              disabled={!status || status === insight.status || savingStatus}
              onClick={saveStatus}
            >
              {savingStatus ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : null}

        {insight.summary ? (
          <div className="mt-6 rounded-xl border border-(--color-divider) bg-(--color-neutral-50) p-5 shadow-sm transition-all hover:shadow-md">
            <K className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
              Summary · shown under the title
            </K>
            <p className="mt-2.5 mb-0 text-[14.5px] leading-[1.65] text-neutral-800">
              {insight.summary}
            </p>
          </div>
        ) : null}
      </div>

      {/* Heading Plate Section */}
      <div className="mt-8 border-t border-(--color-divider) px-5 pt-6 md:px-8">
        <SectionHead>Heading plate</SectionHead>
        {insight.cover_image_url ? (
          <div className="mt-4 flex gap-4">
            <Plate
              matted={false}
              src={insight.cover_image_url}
              alt={insight.cover_image_alt ?? insight.title}
              className="h-24 w-40 flex-none rounded-md border border-(--color-divider) object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1 py-1">
              <K className="text-[13px] leading-relaxed text-neutral-700">
                {insight.cover_image_alt ||
                  "No caption set for this cover image."}
              </K>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-[13.5px] text-neutral-500 italic">
            No cover image set on this article yet.
          </div>
        )}
      </div>

      {/* Filing Section */}
      <div className="mt-8 border-t border-(--color-divider) px-5 pt-6 md:px-8">
        <SectionHead>Filing</SectionHead>
        <div className="mt-4 flex flex-col gap-2">
          <Pair label="Subject">{subjectFor(insight)}</Pair>
          <Pair label="Slug">{insight.slug}</Pair>
          <Pair label="Reading time">{insight.read_minutes} min</Pair>
          <Pair label="Words">{wordsLabel(insight)}</Pair>
          <Pair label="Author's byline">
            {author ? `${author.name}, ${author.role}` : "No author set"}
          </Pair>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {insight.tags.length === 0 ? (
            <span className="cl-tag cl-tag-outline border-neutral-300 text-neutral-500">
              Untagged
            </span>
          ) : (
            insight.tags.map((tag) => (
              <span key={tag.id} className="cl-tag cl-tag-accent shadow-sm">
                {tag.name}
              </span>
            ))
          )}
        </div>
      </div>

      {/* SEO/Search Section */}
      <div className="mt-8 border-t border-(--color-divider) px-5 pt-6 md:px-8">
        <SectionHead>How it will read in search</SectionHead>
        <div className="border-(--color-divider)] mt-4 rounded-xl border bg-white p-5 shadow-sm">
          <K className="text-[12px] text-neutral-500">
            entity.co.ke <span className="mx-1">›</span> insights
          </K>
          <div className="mt-2 cursor-pointer text-[17px] leading-[1.3] font-medium text-[#1a0dab] hover:underline">
            {metaTitle}
          </div>
          <p className="mt-1.5 mb-0 text-[13.5px] leading-[1.6] text-[#4d5156]">
            {metaDescription || "No summary or meta description written yet."}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Pair label="Meta title">{metaTitle.length} of 60 characters</Pair>
          <Pair label="Meta description">
            {metaDescription.length} of 160 characters
          </Pair>
          <Pair label="Indexing">
            <span
              className={
                insight.noindex
                  ? "font-medium text-(--color-accent-urgent)"
                  : ""
              }
            >
              {insight.noindex ? "Hidden from search" : "Indexable"}
            </span>
          </Pair>
        </div>
      </div>

      {/* Linked Listings Section */}
      <div className="mt-8 border-t border-(--color-divider) px-5 pt-6 md:px-8">
        <SectionHead>Linked from</SectionHead>
        {linkedListings.length === 0 ? (
          <div className="mt-4 text-[13.5px] text-neutral-500 italic">
            Not linked to any listings yet.
          </div>
        ) : (
          <div className="mt-4 flex flex-col">
            {linkedListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/admin/listings/${listing.reference_code}`}
                className="group -mx-3 flex items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] transition-colors hover:bg-neutral-50"
              >
                <span className="truncate font-medium text-(--color-text) transition-colors group-hover:text-(--color-accent)">
                  {listing.title}
                </span>
                <K className="cl-fig flex-none text-[12px] text-neutral-500 transition-colors group-hover:text-(--color-text)">
                  {listing.reference_code}
                </K>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log Section */}
      <div className="mt-8 border-t border-(--color-divider) px-5 pt-6 md:px-8">
        <SectionHead>Activity</SectionHead>
        {activity.length === 0 ? (
          <div className="mt-4 text-[13.5px] text-neutral-500 italic">
            No recorded activity for this article yet.
          </div>
        ) : (
          <div className="mt-4 flex flex-col">
            {activity.map((log) => (
              <Link
                key={log.id}
                href={`/admin/audit-log/${log.id}`}
                className="group -mx-3 flex gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-50"
              >
                <span className="cl-fig cl-k w-23 flex-none pt-0.5 text-[11.5px] text-neutral-500 transition-colors group-hover:text-(--color-accent)">
                  {dateLabel(log.created_at)}
                </span>
                <div className="text-[13.5px] leading-normal text-(--color-text) transition-colors group-hover:text-(--color-accent)">
                  {log.action}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
