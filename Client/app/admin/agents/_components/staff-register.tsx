"use client"

import * as React from "react"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { PlusIcon } from "../../../_components/Admin/icons"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn } from "../../../_components/Admin/motion"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useUserContext } from "../../../_lib/Context/User"
import { useListingContext } from "../../../_lib/Context/Listing"
import type { AgentProfile } from "../../../_lib/Types/Agent"
import type { PublicUser, UserRole } from "../../../_lib/Types/User"
import {
  ROLE_LABEL,
  ROLE_TAG_CLASS,
  initialsFor,
  listingsFor,
  patchFor,
} from "../_lib"

const STATE_FILTERS = ["Active", "Inactive", "All"] as const
const ROLE_FILTERS: (UserRole | "all")[] = [
  "all",
  "agent",
  "editor",
  "admin",
  "viewer",
]

type StaffRow =
  | { kind: "agent"; id: string; user: PublicUser; agent: AgentProfile }
  | { kind: "plain"; id: string; user: PublicUser }

/** A row's own "active" flag — an agent's is their public-profile visibility
 * (matches the pre-existing convention), everyone else's is their account
 * being enabled at all, since they have no profile to be visible or not. */
function isRowActive(row: StaffRow): boolean {
  return row.kind === "agent" ? row.agent.is_active : row.user.is_active
}

function rowName(row: StaffRow): string {
  return row.kind === "agent" ? row.agent.display_name : row.user.name
}

function rowCreatedAt(row: StaffRow): string {
  return row.kind === "agent" ? row.agent.created_at : row.user.created_at
}

export function StaffRegister({ selectedId }: { selectedId?: string }) {
  const { agents, loading: agentsLoading } = useAgentContext(),
    { users, loading: usersLoading } = useUserContext(),
    { listings } = useListingContext(),
    [stateFilter, setStateFilter] =
      React.useState<(typeof STATE_FILTERS)[number]>("Active"),
    [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all"),
    [specialism, setSpecialism] = React.useState(""),
    [sort, setSort] = React.useState<"load" | "name" | "since">("load"),
    [query, setQuery] = React.useState("")

  const loading = agentsLoading || usersLoading

  const rows: StaffRow[] = users.map((user) => {
    const agent = agents.find((a) => a.user_id === user.id)
    return agent
      ? { kind: "agent" as const, id: agent.slug, user, agent }
      : { kind: "plain" as const, id: user.id, user }
  })

  const specialisms = Array.from(
    new Set(agents.flatMap((a) => a.specializations))
  ).sort()

  const filtered = rows.filter((row) => {
    if (stateFilter === "Active" && !isRowActive(row)) return false
    if (stateFilter === "Inactive" && isRowActive(row)) return false
    if (roleFilter !== "all" && row.user.role !== roleFilter) return false
    // Specialism only means anything for an agent's own profile — a plain
    // staff row is never excluded by it, whatever's picked.
    if (
      row.kind === "agent" &&
      specialism &&
      !row.agent.specializations.includes(specialism)
    )
      return false
    if (query.trim()) {
      const haystack =
        row.kind === "agent"
          ? `${row.agent.display_name} ${patchFor(row.agent, listings).join(" ")} ${row.agent.specializations.join(" ")}`
          : `${row.user.name} ${row.user.email} ${row.user.phone ?? ""}`
      if (!haystack.toLowerCase().includes(query.trim().toLowerCase()))
        return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return rowName(a).localeCompare(rowName(b))
    if (sort === "since")
      return (
        new Date(rowCreatedAt(a)).getTime() -
        new Date(rowCreatedAt(b)).getTime()
      )
    const loadOf = (row: StaffRow) =>
      row.kind === "agent" ? listingsFor(row.agent, listings).length : 0
    return loadOf(b) - loadOf(a)
  })

  const activeCount = rows.filter(isRowActive).length

  return (
    <div className="min-w-0 border-r-0 border-[var(--color-divider)] md:border-r">
      <PageHead
        title="Staff"
        meta={`${rows.length} on the register · ${activeCount} active`}
      >
        <ButtonLink
          href="/admin/agents/invite"
          variant="primary"
          className="gap-[7px]"
        >
          <PlusIcon size={14} />
          Invite staff
        </ButtonLink>
      </PageHead>

      <div className="px-4 pt-3.5 md:px-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, email, patch or specialism"
          className="cl-input w-full text-[13px]"
        />
      </div>

      <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-2.5 md:flex-wrap md:overflow-visible md:px-6">
        <div className="cl-seg hidden flex-none md:inline-flex">
          {STATE_FILTERS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="staff-state"
                checked={stateFilter === option}
                onChange={() => setStateFilter(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="hidden w-[130px] flex-none text-[13px] md:block"
        >
          {ROLE_FILTERS.map((role) => (
            <option key={role} value={role}>
              {role === "all" ? "Any role" : ROLE_LABEL[role]}
            </option>
          ))}
        </Select>
        <Select
          value={specialism}
          onChange={(e) => setSpecialism(e.target.value)}
          className="hidden w-[160px] flex-none text-[13px] md:block"
        >
          <option value="">Any specialism</option>
          {specialisms.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="hidden w-[160px] flex-none text-[13px] md:block"
        >
          <option value="load">Heaviest load first</option>
          <option value="name">Name A–Z</option>
          <option value="since">Longest serving</option>
        </Select>
      </div>

      <div className="hidden px-6 pt-2 md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_100px_1fr_96px] gap-3 border-b-2 border-[var(--color-text)] pb-[9px]">
          <K>Person</K>
          <K>Role</K>
          <K>Patch / contact</K>
          <K>State</K>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-[var(--color-neutral-600)]">
            {loading ? "Loading staff…" : "No one matches these filters."}
          </div>
        ) : null}

        {sorted.map((row, index) => {
          const active = isRowActive(row),
            name = rowName(row),
            photo = row.kind === "agent" ? row.agent.photo_url : null,
            subtitle =
              row.kind === "agent"
                ? (row.agent.title ?? "Agent")
                : row.user.email,
            patchOrContact =
              row.kind === "agent"
                ? patchFor(row.agent, listings).join(", ") || "No mandates yet"
                : (row.user.phone ?? row.user.email)

          return (
            <RowIn key={row.id} index={index}>
              <Link
                href={`/admin/agents/${row.id}`}
                className={`grid grid-cols-[minmax(0,1fr)_100px_1fr_96px] items-center gap-4 border-b border-[var(--color-divider)] px-2 py-5 text-[var(--color-text)] hover:bg-[var(--color-neutral-100)] ${
                  row.id === selectedId
                    ? "bg-[var(--color-accent-100)] shadow-[inset_3px_0_0_var(--color-accent)]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Plate
                    matted={false}
                    src={photo}
                    alt={name}
                    className="h-11 w-11 flex-none rounded-full"
                    label={initialsFor(name)}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px]">{name}</div>
                    <K className="mt-1.5 truncate">{subtitle}</K>
                  </div>
                </div>
                <div>
                  <span className={`cl-tag ${ROLE_TAG_CLASS[row.user.role]}`}>
                    {ROLE_LABEL[row.user.role]}
                  </span>
                </div>
                <div className="truncate text-[12.5px] leading-[1.6]">
                  {patchOrContact}
                </div>
                <div>
                  <Status tone={active ? "published" : "outline"}>
                    {active ? "Active" : "Inactive"}
                  </Status>
                </div>
              </Link>
            </RowIn>
          )
        })}

        <div className="flex items-center gap-3.5 pt-[18px] pb-7">
          <span className="flex-1" />
          <K className="cl-fig">
            {sorted.length} of {rows.length} shown
          </K>
        </div>
      </div>

      <div className="mt-3 md:hidden">
        {sorted.map((row, index) => {
          const active = isRowActive(row),
            name = rowName(row),
            photo = row.kind === "agent" ? row.agent.photo_url : null,
            subtitle =
              row.kind === "agent"
                ? (row.agent.title ?? "Agent")
                : row.user.email

          return (
            <RowIn key={row.id} index={index}>
              <Link
                href={`/admin/agents/${row.id}`}
                className="block border-b border-[var(--color-divider)] px-4 py-4.5 text-[var(--color-text)]"
              >
                <div className="flex gap-3">
                  <Plate
                    matted={false}
                    src={photo}
                    alt={name}
                    className="h-[46px] w-[46px] flex-none rounded-full"
                    label={initialsFor(name)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      <div className="flex-1 truncate text-[15.5px]">
                        {name}
                      </div>
                      <Status tone={active ? "published" : "outline"}>
                        {active ? "Active" : "Inactive"}
                      </Status>
                    </div>
                    <K className="mt-1.5">{subtitle}</K>
                    <span
                      className={`cl-tag ${ROLE_TAG_CLASS[row.user.role]} mt-1.5 inline-block`}
                    >
                      {ROLE_LABEL[row.user.role]}
                    </span>
                  </div>
                </div>
              </Link>
            </RowIn>
          )
        })}
        <div className="flex items-center gap-3 px-4 py-[18px]">
          <K className="cl-fig">
            {sorted.length} of {rows.length} shown
          </K>
          <span className="flex-1" />
          <ButtonLink href="/admin/agents/invite" variant="primary">
            Invite staff
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
