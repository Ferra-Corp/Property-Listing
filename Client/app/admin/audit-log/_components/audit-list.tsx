"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn } from "../../../_components/Admin/motion"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { useUserContext } from "../../../_lib/Context/User"
import type { Log } from "../../../_lib/Types/Audit"
import {
  categorize,
  changesSummary,
  dayLabel,
  initialsFor,
  toneFor,
  userName,
  type ActionCategory,
} from "../_lib"

const FILTERS = ["All", "Created", "Updated", "Published", "Deleted"] as const

function toCsv(logs: Log[]): string {
  const header = [
      "id",
      "created_at",
      "user_id",
      "entity_type",
      "entity_id",
      "action",
      "ip_address",
    ],
    rows = logs.map((l) =>
      [
        l.id,
        l.created_at,
        l.user_id ?? "",
        l.entity_type,
        l.entity_id,
        l.action,
        l.ip_address ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
  return [header.join(","), ...rows].join("\n")
}

function downloadCsv(logs: Log[]) {
  const blob = new Blob([toCsv(logs)], { type: "text/csv;charset=utf-8;" }),
    url = URL.createObjectURL(blob),
    link = document.createElement("a")
  link.href = url
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function AuditList({ selectedId }: { selectedId?: string }) {
  const { logs, loading } = useLogsContext(),
    { users } = useUserContext(),
    [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All"),
    [entityType, setEntityType] = React.useState(""),
    [query, setQuery] = React.useState("")

  const entityTypes = Array.from(new Set(logs.map((l) => l.entity_type))).sort()

  const filtered = logs.filter((log) => {
    if (
      filter !== "All" &&
      categorize(log.action) !== (filter.toLowerCase() as ActionCategory)
    )
      return false
    if (entityType && log.entity_type !== entityType) return false
    if (
      query.trim() &&
      !log.entity_id.toLowerCase().includes(query.trim().toLowerCase()) &&
      !log.entity_type.toLowerCase().includes(query.trim().toLowerCase())
    )
      return false
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const days = Array.from(new Set(sorted.map((l) => dayLabel(l.created_at))))

  return (
    <div className="min-w-0 border-r-0 border-(--color-divider) md:border-r">
      <PageHead
        title="Audit log"
        meta={`${logs.length} rows · append only · created_at in EAT`}
        search="entity_id or entity_type"
        searchValue={query}
        onSearchChange={setQuery}
      >
        <Button
          type="button"
          variant="primary"
          className="whitespace-nowrap"
          onClick={() => downloadCsv(sorted)}
          disabled={sorted.length === 0}
        >
          Export as CSV
        </Button>
      </PageHead>

      <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-3.5 md:flex-wrap md:overflow-visible md:px-6">
        <div className="cl-seg flex-none">
          {FILTERS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="audit-action"
                checked={filter === option}
                onChange={() => setFilter(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <Select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="hidden w-40 flex-none text-[13px] md:block"
        >
          <option value="">Any entity_type</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      <div className="px-4 pt-2 md:px-6">
        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading
              ? "Loading audit logs…"
              : logs.length === 0
                ? "No audit rows yet."
                : "No rows match these filters."}
          </div>
        ) : null}

        {days.map((day) => {
          const rows = sorted.filter((l) => dayLabel(l.created_at) === day)
          return (
            <div key={day}>
              <div className="sticky top-0 z-4 flex items-baseline gap-3 border-b-2 border-(--color-text) bg-(--color-bg) py-2">
                <span className="text-[15px] md:text-[14px]">{day}</span>
                <K className="cl-fig text-neutral-600">{rows.length} rows</K>
              </div>

              {/* desktop rows */}
              <div className="hidden md:block">
                {rows.map((row, index) => {
                  const name = userName(users, row.user_id)
                  return (
                    <RowIn key={row.id} index={index}>
                      <Link
                        href={`/admin/audit-log/${row.id}`}
                        className={`grid grid-cols-[80px_150px_minmax(0,1fr)_140px_130px] items-start gap-3 border-b border-(--color-divider) py-3 text-(--color-text) hover:bg-neutral-100 ${
                          String(row.id) === selectedId
                            ? "bg-(--color-accent-100) shadow-[inset_3px_0_0_var(--color-accent)]"
                            : ""
                        }`}
                      >
                        <div className="cl-fig cl-k pt-0.5 text-(--color-accent)">
                          {new Date(row.created_at).toLocaleTimeString("en-GB")}
                        </div>
                        <div className="flex items-center gap-2.5">
                          {name ? (
                            <Plate
                              matted={false}
                              className="h-6.5 w-6.5 flex-none rounded-full"
                              label={initialsFor(name)}
                            />
                          ) : (
                            <div className="grid h-6.5 w-6.5 flex-none place-items-center rounded-full border border-dashed border-neutral-400 text-neutral-500">
                              —
                            </div>
                          )}
                          <div className="truncate text-[13px]">
                            {name ?? "unattributed"}
                          </div>
                        </div>
                        <div className="min-w-0 text-[13.5px] leading-[1.55]">
                          <K className="text-neutral-600">{row.entity_type}</K>{" "}
                          <span className="cl-fig break-all">
                            {row.entity_id}
                          </span>
                          <div className="cl-fig mt-1 text-[12.5px] text-neutral-700">
                            {changesSummary(row.changes)}
                          </div>
                        </div>
                        <div>
                          <Status tone={toneFor(row.action)}>
                            {row.action}
                          </Status>
                        </div>
                        <div className="cl-fig cl-k pt-0.5 text-neutral-600">
                          {row.ip_address ?? "—"}
                        </div>
                      </Link>
                    </RowIn>
                  )
                })}
              </div>

              {/* phone rows */}
              <div className="md:hidden">
                {rows.map((row, index) => {
                  const name = userName(users, row.user_id)
                  return (
                    <RowIn key={row.id} index={index}>
                      <Link
                        href={`/admin/audit-log/${row.id}`}
                        className="block border-b border-(--color-divider) py-3 text-(--color-text)"
                      >
                        <div className="flex items-baseline gap-2.5">
                          <div className="cl-fig cl-k flex-none text-(--color-accent)">
                            {new Date(row.created_at).toLocaleTimeString(
                              "en-GB"
                            )}
                          </div>
                          <Status tone={toneFor(row.action)}>
                            {row.action}
                          </Status>
                          <K className="text-neutral-600">{row.entity_type}</K>
                        </div>
                        <div className="mt-2 truncate text-[14.5px] leading-normal">
                          {row.entity_id}
                        </div>
                        <div className="cl-fig mt-1.5 text-[12.5px] text-neutral-700">
                          {changesSummary(row.changes)}
                        </div>
                        <K className="mt-1.5">{name ?? "unattributed"}</K>
                      </Link>
                    </RowIn>
                  )
                })}
              </div>
            </div>
          )
        })}

        {sorted.length > 0 ? (
          <div className="flex items-center gap-3 py-4.5">
            <span className="flex-1" />
            <K className="cl-fig text-neutral-600">
              {sorted.length} of {logs.length} · created_at desc
            </K>
          </div>
        ) : null}
      </div>
    </div>
  )
}
