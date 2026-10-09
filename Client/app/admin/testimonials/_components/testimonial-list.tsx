"use client"

import * as React from "react"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn, useToast } from "../../../_components/Admin/motion"
import { Avatar, Stars } from "../../../_components/ui/testimonial"
import { useTestimonialContext } from "../../../_lib/Context/Testimonial"
import { usePermission } from "../../../_lib/permissions"
import { dateLabel, statusLabel, statusTone } from "../_lib"

export function TestimonialList() {
  const { testimonials, editTestimonial, deleteTestimonial, loading } =
      useTestimonialContext(),
    canCreate = usePermission("Create testimonial"),
    canEdit = usePermission("Edit testimonial"),
    canDelete = usePermission("Delete testimonial"),
    push = useToast(),
    [query, setQuery] = React.useState("")

  const filtered = testimonials.filter((t) => {
    if (!query.trim()) return true
    return `${t.name} ${t.company_name ?? ""} ${t.quote}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  })

  const shownCount = testimonials.filter((t) => t.is_active).length

  async function toggleActive(id: string, is_active: boolean) {
    try {
      await editTestimonial(id, { is_active })
      push({ title: is_active ? "Shown on the site" : "Held back" })
    } catch (error) {
      push({ title: "Couldn't update", body: (error as Error).message })
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete the testimonial from ${name}?`)) return
    try {
      await deleteTestimonial(id)
      push({ title: "Testimonial deleted", body: name })
    } catch (error) {
      push({ title: "Couldn't delete", body: (error as Error).message })
    }
  }

  return (
    <div className="min-w-0">
      <PageHead
        title="Testimonials"
        meta={`${testimonials.length} on file · ${shownCount} shown on the site · ${testimonials.length - shownCount} held back`}
        search="Name, company or quote"
        searchValue={query}
        onSearchChange={setQuery}
      >
        <ButtonLink
          href="/"
          variant="secondary"
          className="hidden md:inline-flex"
        >
          Preview the site
        </ButtonLink>
        {canCreate ? (
          <ButtonLink href="/admin/testimonials/new" variant="primary">
            Add a testimonial
          </ButtonLink>
        ) : null}
      </PageHead>

      <div className="px-4 pt-2 md:px-6">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading
              ? "Loading testimonials…"
              : testimonials.length === 0
                ? "No testimonials yet."
                : "No testimonials match this search."}
          </div>
        ) : null}

        {filtered.map((t, index) => (
          <RowIn key={t.id} index={index}>
            <div className="flex gap-3 border-b border-(--color-divider) py-4">
              <Avatar name={t.name} src={t.profile_picture} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[14.5px]">{t.name}</span>
                  {t.company_name ? <K>{t.company_name}</K> : null}
                  <Stars rating={t.rating} className="text-[13px]" />
                  <Status tone={statusTone(t)}>{statusLabel(t)}</Status>
                </div>
                <p className="mt-1.5 mb-0 line-clamp-3 text-[13px] leading-[1.65] text-neutral-700">
                  {t.quote}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <K className="cl-fig">{dateLabel(t.created_at)}</K>
                  <span className="flex-1" />
                  {canEdit ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => toggleActive(t.id, !t.is_active)}
                      >
                        {t.is_active ? "Hold back" : "Show on site"}
                      </Button>
                      <ButtonLink
                        href={`/admin/testimonials/${t.id}/edit`}
                        variant="secondary"
                      >
                        Edit
                      </ButtonLink>
                    </>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => remove(t.id, t.name)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </RowIn>
        ))}
        <div className="py-6" />
      </div>
    </div>
  )
}
