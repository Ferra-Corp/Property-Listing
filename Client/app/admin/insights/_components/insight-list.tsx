"use client"

import * as React from "react"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn } from "../../../_components/Admin/motion"
import { useToast } from "../../../_components/Admin/motion"
import { useInsightContext } from "../../../_lib/Context/Insight"
import { useUserContext } from "../../../_lib/Context/User"
import type { ContentStatus } from "../../../_lib/Types/Insight"
import {
  authorLabelFor,
  dateLabel,
  STATUS_LABEL,
  STATUS_TONE,
  subjectFor,
  wordsLabel,
} from "../_lib"

const STATE_FILTERS = ["Draft", "Published", "Archived", "All"] as const

export function InsightList({ selectedId }: { selectedId?: string }) {
  const { insights, loading, editInsight } = useInsightContext(),
    { users } = useUserContext(),
    push = useToast(),
    [stateFilter, setStateFilter] =
      React.useState<(typeof STATE_FILTERS)[number]>("All"),
    [subject, setSubject] = React.useState(""),
    [sort, setSort] = React.useState<"updated" | "title" | "read">("updated"),
    [query, setQuery] = React.useState(""),
    [selected, setSelected] = React.useState<Set<string>>(new Set())

  const subjects = Array.from(
    new Set(insights.flatMap((i) => i.tags.map((t) => t.name)))
  ).sort()

  const filtered = insights.filter((insight) => {
    if (stateFilter !== "All" && insight.status !== stateFilter.toLowerCase())
      return false
    if (subject && !insight.tags.some((t) => t.name === subject)) return false
    if (query.trim()) {
      const haystack =
        `${insight.title} ${insight.summary ?? ""} ${subjectFor(insight)}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title)
    if (sort === "read") return b.view_count - a.view_count
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const counts = {
    draft: insights.filter((i) => i.status === "draft").length,
    published: insights.filter((i) => i.status === "published").length,
    archived: insights.filter((i) => i.status === "archived").length,
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkSetStatus(status: ContentStatus) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => editInsight(id, { status })))
      push({
        title: `${ids.length} article${ids.length === 1 ? "" : "s"} moved to ${STATUS_LABEL[status].toLowerCase()}`,
      })
      setSelected(new Set())
    } catch (error) {
      push({
        title: "Couldn't update those articles",
        body: (error as Error).message,
      })
    }
  }

  return (
    <div className="min-w-0 border-r-0 border-(--color-divider) bg-(--color-bg) md:border-r">
      <PageHead
        title="Insights"
        meta={`${counts.published} in print · ${counts.draft} draft${counts.draft === 1 ? "" : "s"} · ${counts.archived} archived`}
        search="Title, summary or tag"
      >
        <ButtonLink href="/admin/insights/new" variant="primary">
          Begin an article
        </ButtonLink>
      </PageHead>

      {/* Mobile Search */}
      <div className="px-4 pt-4 md:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, summary or tag..."
          className="cl-input w-full rounded-lg text-[13.5px] transition-all duration-200 focus:ring-2 focus:ring-neutral-300 focus:outline-none"
        />
      </div>

      {/* Filters Bar */}
      <div className="scr flex items-center gap-3 overflow-x-auto px-4 pt-4 pb-2 md:flex-wrap md:overflow-visible md:px-6 md:pt-6 md:pb-4">
        <div className="cl-seg hidden flex-none rounded-md shadow-sm md:inline-flex">
          {STATE_FILTERS.map((option) => (
            <label
              key={option}
              className="cl-seg-opt transition-colors duration-200 hover:bg-neutral-100"
            >
              <input
                type="radio"
                name="insight-state"
                checked={stateFilter === option}
                onChange={() => setStateFilter(option)}
                className="sr-only" // Assuming cl-seg handles the visual state, hide raw radio
              />
              <span className={stateFilter === option ? "font-medium" : ""}>
                {option}
              </span>
            </label>
          ))}
        </div>
        <Select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="hidden w-40 flex-none rounded-md text-[13px] shadow-sm transition-all focus:ring-2 focus:ring-neutral-300 md:block"
        >
          <option value="">Any tag</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="hidden w-42.5 flex-none rounded-md text-[13px] shadow-sm transition-all focus:ring-2 focus:ring-neutral-300 md:block"
        >
          <option value="updated">Recently updated</option>
          <option value="title">Title A–Z</option>
          <option value="read">Most read</option>
        </Select>
      </div>

      {/* Desktop List */}
      <div className="hidden px-6 pt-2 md:block">
        {/* Classical Editorial Header */}
        <div className="grid grid-cols-[26px_minmax(0,1fr)_140px_120px_92px] items-end gap-4 border-b-[1.5px] border-(--color-text) pb-2.5">
          <div className="pl-1">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={sorted.length > 0 && selected.size === sorted.length}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? new Set(sorted.map((i) => i.id))
                    : new Set()
                )
              }
              className="h-3.5 w-3.5 cursor-pointer accent-(--color-text)"
            />
          </div>
          <K className="text-[10.5px] font-semibold tracking-[0.06em] text-neutral-600 uppercase">
            Article
          </K>
          <K className="text-[10.5px] font-semibold tracking-[0.06em] text-neutral-600 uppercase">
            Author
          </K>
          <K className="text-[10.5px] font-semibold tracking-[0.06em] text-neutral-600 uppercase">
            State
          </K>
          <K className="text-[10.5px] font-semibold tracking-[0.06em] text-neutral-600 uppercase">
            Read
          </K>
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 text-center text-[13.5px] text-neutral-500 italic">
            {loading ? "Loading articles…" : "No articles match the current filters."}
          </div>
        ) : null}

        {/* Rows */}
        <div className="flex flex-col">
          {sorted.map((insight, index) => (
            <RowIn key={insight.id} index={index}>
              <div
                className={`group grid grid-cols-[26px_minmax(0,1fr)_140px_120px_92px] items-start gap-4 border-b border-(--color-divider) py-4 text-(--color-text) transition-colors duration-200 hover:bg-(--color-neutral-50) ${
                  insight.id === selectedId
                    ? "bg-(--color-neutral-50) shadow-[inset_3px_0_0_var(--color-text)]"
                    : "shadow-[inset_0_0_0_transparent]"
                }`}
              >
                <div className="pt-0.5 pl-1">
                  <input
                    type="checkbox"
                    checked={selected.has(insight.id)}
                    onChange={() => toggle(insight.id)}
                    aria-label={`Select ${insight.title}`}
                    className="h-3.5 w-3.5 cursor-pointer accent-(--color-text) transition-opacity group-hover:opacity-100"
                  />
                </div>
                <Link
                  href={`/admin/insights/${insight.id}`}
                  className="flex gap-4 outline-none"
                >
                  <Plate
                    matted={false}
                    src={insight.cover_image_url}
                    alt={insight.cover_image_alt ?? insight.title}
                    className="h-12 w-17 flex-none rounded border border-(--color-divider) object-cover shadow-sm transition-transform duration-300 group-hover:shadow-md"
                    label={insight.cover_image_url ? "" : "No plate"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] leading-[1.35] font-medium tracking-tight transition-colors group-hover:text-(--color-accent)">
                      {insight.title}
                    </div>
                    <K className="cl-fig mt-1.5 block text-[12px] text-neutral-500">
                      {insight.slug}
                    </K>
                    <K
                      className={`mt-1.5 block text-[11px] tracking-wide uppercase ${
                        insight.tags.length === 0
                          ? "text-neutral-400 italic"
                          : "text-neutral-600"
                      }`}
                    >
                      {subjectFor(insight)}
                    </K>
                  </div>
                </Link>
                <Link
                  href={`/admin/insights/${insight.id}`}
                  className="text-[13px] leading-normal transition-colors outline-none group-hover:text-(--color-accent)"
                >
                  {authorLabelFor(insight, users)}
                  <K className="mt-1.5 block text-[11px] text-neutral-500">
                    {wordsLabel(insight)}
                  </K>
                </Link>
                <Link
                  href={`/admin/insights/${insight.id}`}
                  className="outline-none"
                >
                  <Status tone={STATUS_TONE[insight.status]}>
                    {STATUS_LABEL[insight.status]}
                  </Status>
                  <K className="mt-1.5 block text-[12px] text-neutral-500">
                    {dateLabel(insight.updated_at)}
                  </K>
                </Link>
                <Link
                  href={`/admin/insights/${insight.id}`}
                  className="cl-fig pt-0.5 text-[13px] text-neutral-600 transition-colors outline-none group-hover:text-(--color-text)"
                >
                  {insight.view_count > 0
                    ? insight.view_count.toLocaleString()
                    : "—"}
                </Link>
              </div>
            </RowIn>
          ))}
        </div>

        {/* Bulk Actions Footer */}
        <div
          className={`mt-4 mb-8 flex items-center gap-4 rounded-lg px-4 py-3.5 transition-all duration-300 ${
            selected.size > 0
              ? "border border-(--color-divider) bg-(--color-neutral-50) shadow-sm"
              : "pointer-events-none opacity-60 grayscale"
          }`}
        >
          <K className="font-medium text-(--color-text)">
            {selected.size} selected
          </K>
          <div className="mx-1 h-4 w-px bg-(--color-divider)" />
          <ButtonLink
            href="#"
            variant="secondary"
            className="text-[12.5px]"
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
            className="text-[12.5px]"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("draft")
            }}
          >
            Move to draft
          </ButtonLink>
          <ButtonLink
            href="#"
            variant="secondary"
            className="text-[12.5px]"
            onClick={(e) => {
              e.preventDefault()
              bulkSetStatus("archived")
            }}
          >
            Archive
          </ButtonLink>
          <span className="flex-1" />
          <K className="cl-fig text-[12.5px]">
            {sorted.length} of {insights.length} shown
          </K>
        </div>
      </div>

      {/* Mobile List */}
      <div className="mt-2 md:hidden">
        {sorted.map((insight, index) => (
          <RowIn key={insight.id} index={index}>
            <Link
              href={`/admin/insights/${insight.id}`}
              className="group block border-b border-(--color-divider) px-4 py-4 text-(--color-text) transition-colors active:bg-(--color-neutral-50)"
            >
              <div className="flex gap-4">
                <Plate
                  matted={false}
                  src={insight.cover_image_url}
                  alt={insight.cover_image_alt ?? insight.title}
                  className="h-15 w-21 flex-none rounded border border-(--color-divider) object-cover shadow-sm"
                  label={insight.cover_image_url ? "" : "No plate"}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] leading-[1.35] font-medium tracking-tight">
                    {insight.title}
                  </div>
                  <K className="mt-1 block text-[12px] text-neutral-600">
                    {authorLabelFor(insight, users).split(" ")[0]}{" "}
                    <span className="mx-1 opacity-50">·</span>{" "}
                    <span className="text-[10.5px] tracking-wide uppercase">
                      {subjectFor(insight)}
                    </span>
                  </K>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <Status tone={STATUS_TONE[insight.status]}>
                      {STATUS_LABEL[insight.status]}
                    </Status>
                    <K className="text-[11.5px] text-neutral-500">
                      {dateLabel(insight.updated_at)}
                    </K>
                  </div>
                </div>
              </div>
            </Link>
          </RowIn>
        ))}
        <div className="flex items-center gap-3 px-4 py-6">
          <K className="cl-fig text-[13px]">
            {sorted.length} of {insights.length} shown
          </K>
          <span className="flex-1" />
          <ButtonLink
            href="/admin/insights/new"
            variant="primary"
            className="shadow-sm"
          >
            Begin an article
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
