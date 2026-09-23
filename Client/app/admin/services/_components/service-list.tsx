"use client"

import * as React from "react"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Plate } from "../../../_components/ui/plate"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn, useToast } from "../../../_components/Admin/motion"
import { useServiceContext } from "../../../_lib/Context/Service"
import { usePermission } from "../../../_lib/permissions"
import { bySortOrder, statusLabel, statusTone } from "../_lib"

const STATE_FILTERS = ["Shown", "Held back", "All"] as const

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "up" | "down"
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      aria-label={direction === "up" ? "Move up" : "Move down"}
      className="flex size-6 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {direction === "up" ? "↑" : "↓"}
    </button>
  )
}

export function ServiceList({ selectedId }: { selectedId?: string }) {
  const { services, editService, loading } = useServiceContext(),
    canCreate = usePermission("Create service"),
    canEdit = usePermission("Edit service"),
    push = useToast(),
    [stateFilter, setStateFilter] =
      React.useState<(typeof STATE_FILTERS)[number]>("All"),
    [query, setQuery] = React.useState(""),
    [selected, setSelected] = React.useState<Set<string>>(new Set())

  const ordered = bySortOrder(services)

  const filtered = ordered.filter((service) => {
    if (stateFilter === "Shown" && !service.is_active) return false
    if (stateFilter === "Held back" && service.is_active) return false
    if (query.trim()) {
      const haystack = `${service.title} ${service.summary ?? ""}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const activeCount = services.filter((s) => s.is_active).length,
    heldBackCount = services.length - activeCount

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkSetActive(is_active: boolean) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => editService(id, { is_active })))
      push({
        title: is_active
          ? `${ids.length} service${ids.length === 1 ? "" : "s"} shown on the site`
          : `${ids.length} service${ids.length === 1 ? "" : "s"} held back`,
      })
      setSelected(new Set())
    } catch (error) {
      push({
        title: "Couldn't update those services",
        body: (error as Error).message,
      })
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = ordered[index + direction]
    const current = ordered[index]
    if (!target || !current) return
    try {
      await Promise.all([
        editService(current.id, { sort_order: target.sort_order }),
        editService(target.id, { sort_order: current.sort_order }),
      ])
    } catch (error) {
      push({ title: "Couldn't reorder", body: (error as Error).message })
    }
  }

  return (
    <div className="min-w-0 border-r-0 border-(--color-divider) md:border-r">
      <PageHead
        title="Services"
        meta={`${services.length} on the shelf · ${activeCount} shown on the site · ${heldBackCount} held back`}
        search="Title or summary"
        searchValue={query}
        onSearchChange={setQuery}
      >
        <ButtonLink
          href="/system/services"
          variant="secondary"
          className="hidden md:inline-flex"
        >
          Preview the page
        </ButtonLink>
        {canCreate ? (
          <ButtonLink href="/admin/services/new" variant="primary">
            Add a service
          </ButtonLink>
        ) : null}
      </PageHead>

      <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-2.5 md:flex-wrap md:overflow-visible md:px-6">
        <div className="cl-seg flex-none">
          {STATE_FILTERS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="service-state"
                checked={stateFilter === option}
                onChange={() => setStateFilter(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <K className="hidden md:block">
          Use the arrows to change where a service sits on the page
        </K>
      </div>

      <div className="hidden px-6 pt-2 md:block">
        <div className="grid grid-cols-[22px_56px_minmax(0,1fr)_110px] gap-3 border-b-2 border-(--color-text) pb-2.25">
          <div>
            {canEdit ? (
              <input
                type="checkbox"
                aria-label="Select all"
                checked={
                  filtered.length > 0 && selected.size === filtered.length
                }
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? new Set(filtered.map((s) => s.id))
                      : new Set()
                  )
                }
              />
            ) : null}
          </div>
          <K>Order</K>
          <K>Service</K>
          <K>State</K>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading ? "Loading services…" : "No services match these filters."}
          </div>
        ) : null}

        {filtered.map((service, index) => {
          const orderedIndex = ordered.findIndex((s) => s.id === service.id)
          return (
            <RowIn key={service.id} index={index}>
              <div
                className={`grid grid-cols-[22px_56px_minmax(0,1fr)_110px] items-center gap-3 border-b border-(--color-divider) py-3.5 text-(--color-text) hover:bg-neutral-100 ${
                  service.id === selectedId
                    ? "bg-(--color-accent-100) shadow-[inset_3px_0_0_var(--color-accent)]"
                    : ""
                }`}
              >
                <div>
                  {canEdit ? (
                    <input
                      type="checkbox"
                      checked={selected.has(service.id)}
                      onChange={() => toggle(service.id)}
                      aria-label={`Select ${service.title}`}
                    />
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {canEdit ? (
                    <>
                      <ArrowButton
                        direction="up"
                        disabled={orderedIndex === 0}
                        onClick={() => move(orderedIndex, -1)}
                      />
                      <ArrowButton
                        direction="down"
                        disabled={orderedIndex === ordered.length - 1}
                        onClick={() => move(orderedIndex, 1)}
                      />
                    </>
                  ) : null}
                </div>
                <Link
                  href={`/admin/services/${service.id}`}
                  className="flex gap-3"
                >
                  <Plate
                    matted={false}
                    src={service.image_url}
                    alt={service.title}
                    className="h-10.5 w-14.5 flex-none"
                    label={service.image_url ? "" : "No plate"}
                  />
                  <div className="min-w-0">
                    <div className="text-[14.5px]">{service.title}</div>
                    <K className="cl-fig mt-1.5">{service.slug}</K>
                    <K
                      className={`mt-1.5 truncate ${!service.summary ? "text-(--color-accent-2)" : ""}`}
                    >
                      {service.summary || "No summary written"}
                    </K>
                  </div>
                </Link>
                <Link href={`/admin/services/${service.id}`}>
                  <Status tone={statusTone(service)}>
                    {statusLabel(service)}
                  </Status>
                </Link>
              </div>
            </RowIn>
          )
        })}

        <div className="flex items-center gap-3.5 pt-4.5 pb-7">
          {canEdit ? (
            <>
              <K>With selected ({selected.size})</K>
              <ButtonLink
                href="#"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  bulkSetActive(true)
                }}
              >
                Show on site
              </ButtonLink>
              <ButtonLink
                href="#"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  bulkSetActive(false)
                }}
              >
                Hold back
              </ButtonLink>
            </>
          ) : null}
          <span className="flex-1" />
          <K className="cl-fig">
            {filtered.length} of {services.length} shown
          </K>
        </div>
      </div>

      <div className="mt-3 md:hidden">
        {filtered.map((service, index) => (
          <RowIn key={service.id} index={index}>
            <Link
              href={`/admin/services/${service.id}`}
              className="block border-b border-(--color-divider) px-4 py-3.5 text-(--color-text)"
            >
              <div className="flex gap-2.5">
                <Plate
                  matted={false}
                  src={service.image_url}
                  alt={service.title}
                  className="h-12.5 w-16.5 flex-none"
                  label={service.image_url ? "" : "No plate"}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px]">{service.title}</div>
                  <K className="mt-1.5 truncate">
                    {service.summary || "No summary written"}
                  </K>
                  <div className="mt-2">
                    <Status tone={statusTone(service)}>
                      {statusLabel(service)}
                    </Status>
                  </div>
                </div>
              </div>
            </Link>
          </RowIn>
        ))}
        <div className="flex items-center gap-3 px-4 py-4.5">
          <K className="cl-fig">
            {filtered.length} of {services.length} shown
          </K>
          <span className="flex-1" />
          {canCreate ? (
            <ButtonLink href="/admin/services/new" variant="primary">
              Add
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </div>
  )
}
