"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Input, Textarea } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { FormField, K, SectionHead } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useServiceContext } from "../../../_lib/Context/Service"
import { uploadImage } from "../../../_lib/uploadImage"
import { slugify } from "../../../_lib/format"
import type { Service } from "../../../_lib/Types/Service"

type Draft = {
  title: string
  slug: string
  summary: string
  description: string
  icon: string
  image_url: string
  meta_title: string
  meta_description: string
  is_active: boolean
}

function draftFrom(service?: Service): Draft {
  return {
    title: service?.title ?? "",
    slug: service?.slug ?? "",
    summary: service?.summary ?? "",
    description: service?.description ?? "",
    icon: service?.icon ?? "",
    image_url: service?.image_url ?? "",
    meta_title: service?.meta_title ?? "",
    meta_description: service?.meta_description ?? "",
    is_active: service?.is_active ?? true,
  }
}

export function ServiceForm({ service }: { service?: Service }) {
  const { createService, editService } = useServiceContext(),
    push = useToast(),
    router = useRouter()

  const [draft, setDraft] = React.useState<Draft>(() => draftFrom(service)),
    [saving, setSaving] = React.useState(false),
    [error, setError] = React.useState<string | null>(null),
    [uploading, setUploading] = React.useState(false)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file, "service")
      set("image_url", result.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!draft.title.trim() || !draft.slug.trim()) {
      setError("A title and slug are required.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        summary: draft.summary.trim() || null,
        description: draft.description.trim() || null,
        icon: draft.icon.trim() || null,
        image_url: draft.image_url || null,
        meta_title: draft.meta_title.trim() || null,
        meta_description: draft.meta_description.trim() || null,
        is_active: draft.is_active,
      }

      if (service) {
        await editService(service.id, payload)
        push({ title: "Service saved", body: draft.title.trim() })
        router.push(`/admin/services/${service.id}`)
      } else {
        await createService(payload)
        push({ title: "Service created", body: draft.title.trim() })
        router.push("/admin/services")
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7">
        <h1 className="m-0 text-[22px] font-normal">
          {service ? "Edit service" : "New service"}
        </h1>
        <span className="flex-1" />
        <ButtonLink
          href={service ? `/admin/services/${service.id}` : "/admin/services"}
          variant="secondary"
        >
          Cancel
        </ButtonLink>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : service ? "Save changes" : "Create service"}
        </Button>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-(--cl-radius-md) border border-(--color-accent-2-300) bg-(--color-accent-2-100) px-4 py-3 text-[13px] text-(--color-accent-2-700) md:mx-7">
          {error}
        </div>
      ) : null}

      <div className="px-4 md:px-7">
        <SectionHead className="mt-5">Copy</SectionHead>

        <FormField label="Title">
          <Input
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value
              set("title", title)
              if (!service) set("slug", slugify(title))
            }}
            placeholder="Residential sales"
            className="text-[14px]"
          />
        </FormField>

        <FormField label="Slug" hint="entity.co.ke/services/…">
          <Input
            value={draft.slug}
            onChange={(e) => set("slug", slugify(e.target.value))}
            className="cl-fig text-[13.5px]"
          />
        </FormField>

        <FormField
          label="Summary"
          hint="The short line shown under the heading"
        >
          <Textarea
            value={draft.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="min-h-17.5 text-[13.5px]"
          />
        </FormField>

        <FormField
          label="Description"
          hint="A fuller paragraph, shown under the summary"
        >
          <Textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-27.5 text-[13.5px]"
          />
        </FormField>

        <SectionHead className="mt-2">Image</SectionHead>

        <FormField label="Cover">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Plate
              matted={false}
              src={draft.image_url || undefined}
              alt={draft.title}
              className="aspect-video w-full flex-none sm:w-55"
              label="No image"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <label className="cl-btn cl-btn-secondary inline-flex w-fit cursor-pointer items-center">
                {uploading
                  ? "Uploading…"
                  : draft.image_url
                    ? "Replace image"
                    : "Upload image"}
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
              {draft.image_url ? (
                <button
                  type="button"
                  onClick={() => set("image_url", "")}
                  className="w-fit text-[12.5px] text-(--color-accent-2) underline underline-offset-2"
                >
                  Remove image
                </button>
              ) : null}
            </div>
          </div>
        </FormField>

        <SectionHead className="mt-2">Filing</SectionHead>

        <FormField
          label="Icon key"
          hint="Not yet shown on the public page — reserved for later"
        >
          <Input
            value={draft.icon}
            onChange={(e) => set("icon", e.target.value)}
            placeholder="e.g. building, key, chart"
            className="text-[13.5px]"
          />
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
          <K className="mt-2 text-neutral-600">
            {service
              ? "Its position on the page is set from the services register, not here."
              : "New services are added to the end of the list — reorder from the register once saved."}
          </K>
        </FormField>

        <SectionHead className="mt-2">How it will read in search</SectionHead>

        <FormField
          label="Meta title"
          hint="Falls back to the title if left blank"
        >
          <Input
            value={draft.meta_title}
            onChange={(e) => set("meta_title", e.target.value)}
            className="text-[13.5px]"
          />
          <K className="mt-2 text-neutral-600">
            {(draft.meta_title || draft.title).length} of 60
          </K>
        </FormField>

        <FormField
          label="Meta description"
          hint="Falls back to the summary if left blank"
        >
          <Textarea
            value={draft.meta_description}
            onChange={(e) => set("meta_description", e.target.value)}
            className="min-h-15 text-[13.5px]"
          />
          <K className="mt-2 text-neutral-600">
            {(draft.meta_description || draft.summary).length} of 160
          </K>
        </FormField>

        <div className="flex items-center justify-end gap-3 py-7">
          <ButtonLink
            href={service ? `/admin/services/${service.id}` : "/admin/services"}
            variant="secondary"
          >
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : service ? "Save changes" : "Create service"}
          </Button>
        </div>
      </div>
    </form>
  )
}
