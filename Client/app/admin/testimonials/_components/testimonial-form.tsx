"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Input, Select, Textarea } from "../../../_components/ui/field"
import { Avatar, Stars } from "../../../_components/ui/testimonial"
import { FormField, SectionHead } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useTestimonialContext } from "../../../_lib/Context/Testimonial"
import { usePermission } from "../../../_lib/permissions"
import { uploadImage } from "../../../_lib/uploadImage"
import type { Testimonial } from "../../../_lib/Types/Testimonial"

type Draft = {
  name: string
  quote: string
  rating: number
  company_name: string
  company_profile_image_url: string
  profile_picture: string
  is_active: boolean
}

function draftFrom(testimonial?: Testimonial): Draft {
  return {
    name: testimonial?.name ?? "",
    quote: testimonial?.quote ?? "",
    rating: testimonial?.rating ?? 5,
    company_name: testimonial?.company_name ?? "",
    company_profile_image_url: testimonial?.company_profile_image_url ?? "",
    profile_picture: testimonial?.profile_picture ?? "",
    is_active: testimonial?.is_active ?? true,
  }
}

export function TestimonialForm({
  testimonial,
}: {
  testimonial?: Testimonial
}) {
  const { createTestimonial, editTestimonial } = useTestimonialContext(),
    canUse = usePermission(
      testimonial ? "Edit testimonial" : "Create testimonial"
    ),
    push = useToast(),
    router = useRouter()

  const [draft, setDraft] = React.useState<Draft>(() =>
      draftFrom(testimonial)
    ),
    [saving, setSaving] = React.useState(false),
    [error, setError] = React.useState<string | null>(null),
    [uploading, setUploading] = React.useState(false),
    [uploadingLogo, setUploadingLogo] = React.useState(false)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file, "testimonial")
      set("profile_picture", result.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    setError(null)
    try {
      const result = await uploadImage(file, "testimonial")
      set("company_profile_image_url", result.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!draft.name.trim() || !draft.quote.trim()) {
      setError("A name and the testimonial itself are required.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: draft.name.trim(),
        quote: draft.quote.trim(),
        rating: draft.rating,
        company_name: draft.company_name.trim() || null,
        company_profile_image_url: draft.company_profile_image_url || null,
        profile_picture: draft.profile_picture || null,
        is_active: draft.is_active,
      }

      if (testimonial) {
        await editTestimonial(testimonial.id, payload)
        push({ title: "Testimonial saved", body: payload.name })
      } else {
        await createTestimonial(payload)
        push({ title: "Testimonial created", body: payload.name })
      }
      router.push("/admin/testimonials")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!canUse && !testimonial) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
        <p className="m-0">
          You don&apos;t have permission to create testimonials.
        </p>
        <ButtonLink href="/admin/testimonials" variant="secondary">
          Back to Testimonials
        </ButtonLink>
      </div>
    )
  }

  const submitLabel = saving
    ? "Saving…"
    : testimonial
      ? "Save changes"
      : "Create testimonial"

  return (
    <form onSubmit={handleSubmit} className="min-w-0">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7">
        <h1 className="m-0 text-[22px] font-normal">
          {testimonial ? "Edit testimonial" : "New testimonial"}
        </h1>
        <span className="flex-1" />
        <ButtonLink href="/admin/testimonials" variant="secondary">
          Cancel
        </ButtonLink>
        {canUse ? (
          <Button type="submit" variant="primary" disabled={saving}>
            {submitLabel}
          </Button>
        ) : null}
      </div>

      {!canUse ? (
        <p className="mx-4 mt-4 text-[13px] text-neutral-600 md:mx-7">
          Read-only — your role can view this testimonial but not change it.
        </p>
      ) : null}

      {error ? (
        <div className="mx-4 mt-4 rounded-(--cl-radius-md) border border-(--color-accent-2-300) bg-(--color-accent-2-100) px-4 py-3 text-[13px] text-(--color-accent-2-700) md:mx-7">
          {error}
        </div>
      ) : null}

      <fieldset disabled={!canUse} className="contents">
        <div className="px-4 md:px-7">
          <SectionHead className="mt-5">Who said it</SectionHead>

          <FormField label="Name">
            <Input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Wanjiru"
              className="text-[14px]"
            />
          </FormField>

          <FormField label="Company" hint="Optional">
            <Input
              value={draft.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              className="text-[13.5px]"
            />
          </FormField>

          <FormField
            label="Company logo"
            hint="Optional — shown in the homepage logo band"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-32 flex-none items-center justify-center overflow-hidden rounded-(--cl-radius-md) border border-(--color-divider) p-2">
                {draft.company_profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.company_profile_image_url}
                    alt={draft.company_name || "Company logo"}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="cl-k text-neutral-600">No logo</span>
                )}
              </span>
              <div className="flex flex-col gap-2.5">
                <label className="cl-btn cl-btn-secondary inline-flex w-fit cursor-pointer items-center">
                  {uploadingLogo
                    ? "Uploading…"
                    : draft.company_profile_image_url
                      ? "Replace logo"
                      : "Upload logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file)
                      e.target.value = ""
                    }}
                  />
                </label>
                {draft.company_profile_image_url ? (
                  <button
                    type="button"
                    onClick={() => set("company_profile_image_url", "")}
                    className="w-fit text-[12.5px] text-(--color-accent-2) underline underline-offset-2"
                  >
                    Remove logo
                  </button>
                ) : null}
              </div>
            </div>
          </FormField>

          <FormField label="Profile picture" hint="Optional">
            <div className="flex items-center gap-4">
              <Avatar
                name={draft.name || "?"}
                src={draft.profile_picture}
                className="size-16 text-[22px]"
              />
              <div className="flex flex-col gap-2.5">
                <label className="cl-btn cl-btn-secondary inline-flex w-fit cursor-pointer items-center">
                  {uploading
                    ? "Uploading…"
                    : draft.profile_picture
                      ? "Replace picture"
                      : "Upload picture"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                      e.target.value = ""
                    }}
                  />
                </label>
                {draft.profile_picture ? (
                  <button
                    type="button"
                    onClick={() => set("profile_picture", "")}
                    className="w-fit text-[12.5px] text-(--color-accent-2) underline underline-offset-2"
                  >
                    Remove picture
                  </button>
                ) : null}
              </div>
            </div>
          </FormField>

          <SectionHead className="mt-2">What they said</SectionHead>

          <FormField label="Testimonial">
            <Textarea
              value={draft.quote}
              onChange={(e) => set("quote", e.target.value)}
              className="min-h-32 text-[13.5px]"
            />
          </FormField>

          <FormField label="Rating" hint="Out of 5">
            <div className="flex items-center gap-4">
              <Select
                value={draft.rating}
                onChange={(e) => set("rating", Number(e.target.value))}
                className="w-24 text-[13.5px]"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              <Stars rating={draft.rating} className="text-[18px]" />
            </div>
          </FormField>

          <FormField label="Status">
            <label className="flex items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              Shown on the site
            </label>
          </FormField>

          <div className="flex items-center justify-end gap-3 py-7">
            <ButtonLink href="/admin/testimonials" variant="secondary">
              Cancel
            </ButtonLink>
            {canUse ? (
              <Button type="submit" variant="primary" disabled={saving}>
                {submitLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </fieldset>
    </form>
  )
}
