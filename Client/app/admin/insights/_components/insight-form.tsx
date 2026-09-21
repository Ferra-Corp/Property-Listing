"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Input, Textarea, Select } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import {
  FormField,
  K,
  SectionHead,
  Status,
} from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useInsightContext } from "../../../_lib/Context/Insight"
import { useInsightTagContext } from "../../../_lib/Context/Insight Tag"
import { useTagContext } from "../../../_lib/Context/Tag"
import { useUserContext } from "../../../_lib/Context/User"
import { uploadImage } from "../../../_lib/uploadImage"
import type {
  ContentStatus,
  InsightWithTags,
} from "../../../_lib/Types/Insight"
import { wordCountFromHtml, STATUS_LABEL } from "../_lib"
import { slugify } from "../../../_lib/format"
import { RichEditor } from "./rich-editor"

type Draft = {
  title: string
  slug: string
  summary: string
  content: string
  cover_image_url: string
  cover_image_alt: string
  author_id: string
  status: ContentStatus
  target_country_code: string
  target_state_region: string
  target_city: string
  meta_title: string
  meta_description: string
  canonical_url: string
  og_image_url: string
  noindex: boolean
  published_at: string
  tagIds: string[]
}

function draftFrom(insight?: InsightWithTags): Draft {
  return {
    title: insight?.title ?? "",
    slug: insight?.slug ?? "",
    summary: insight?.summary ?? "",
    content: insight?.content ?? "",
    cover_image_url: insight?.cover_image_url ?? "",
    cover_image_alt: insight?.cover_image_alt ?? "",
    author_id: insight?.author_id ?? "",
    status: insight?.status ?? "draft",
    target_country_code: insight?.target_country_code ?? "",
    target_state_region: insight?.target_state_region ?? "",
    target_city: insight?.target_city ?? "",
    meta_title: insight?.meta_title ?? "",
    meta_description: insight?.meta_description ?? "",
    canonical_url: insight?.canonical_url ?? "",
    og_image_url: insight?.og_image_url ?? "",
    noindex: insight?.noindex ?? false,
    published_at: insight?.published_at
      ? new Date(insight.published_at).toISOString().slice(0, 16)
      : "",
    tagIds: insight?.tags.map((t) => t.id) ?? [],
  }
}

export function InsightForm({ insight }: { insight?: InsightWithTags }) {
  const { createInsight: _create, editInsight } = useInsightContext(),
    { attachTag, detachTag } = useInsightTagContext(),
    { tags, createTag, fetchTags } = useTagContext(),
    { users } = useUserContext(),
    push = useToast(),
    router = useRouter()

  void _create // creation goes through a raw fetch below to recover the new id

  const [draft, setDraft] = React.useState<Draft>(() => draftFrom(insight)),
    [saving, setSaving] = React.useState(false),
    [error, setError] = React.useState<string | null>(null),
    [uploading, setUploading] = React.useState(false),
    [newTagName, setNewTagName] = React.useState("")

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleTag(id: string) {
    setDraft((d) => ({
      ...d,
      tagIds: d.tagIds.includes(id)
        ? d.tagIds.filter((t) => t !== id)
        : [...d.tagIds, id],
    }))
  }

  async function handleAddTag() {
    const name = newTagName.trim()
    if (!name) return
    try {
      await createTag({ name, slug: slugify(name) })
      await fetchTags()
      setNewTagName("")
    } catch (err) {
      push({ title: "Couldn't add that tag", body: (err as Error).message })
    }
  }

  async function handleCoverUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file)
      set("cover_image_url", result.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function publishedAtPayload(): string | null {
    if (draft.status !== "published") return null
    return draft.published_at
      ? new Date(draft.published_at).toISOString()
      : new Date().toISOString()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!draft.title.trim() || !draft.slug.trim() || !draft.content.trim()) {
      setError("A title, slug and some content are required.")
      return
    }

    setSaving(true)
    try {
      if (insight) {
        await editInsight(insight.id, {
          title: draft.title.trim(),
          slug: draft.slug.trim(),
          summary: draft.summary.trim() || null,
          content: draft.content,
          word_count: wordCountFromHtml(draft.content),
          cover_image_url: draft.cover_image_url || null,
          cover_image_alt: draft.cover_image_alt.trim() || null,
          author_id: draft.author_id || null,
          status: draft.status,
          published_at: publishedAtPayload(),
          target_country_code: draft.target_country_code.trim() || null,
          target_state_region: draft.target_state_region.trim() || null,
          target_city: draft.target_city.trim() || null,
          meta_title: draft.meta_title.trim() || null,
          meta_description: draft.meta_description.trim() || null,
          canonical_url: draft.canonical_url.trim() || null,
          og_image_url: draft.og_image_url.trim() || null,
          noindex: draft.noindex,
        })

        const before = new Set(insight.tags.map((t) => t.id)),
          after = new Set(draft.tagIds)

        await Promise.all([
          ...[...after]
            .filter((id) => !before.has(id))
            .map((id) => attachTag(insight.id, { tag_id: id })),
          ...[...before]
            .filter((id) => !after.has(id))
            .map((id) => detachTag(insight.id, id)),
        ])

        push({ title: "Article saved", body: draft.title.trim() })
        router.push(`/admin/insights/${insight.id}`)
      } else {
        const createRequest = await fetch("/system/api/v1/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: draft.title.trim(),
              slug: draft.slug.trim(),
              summary: draft.summary.trim() || null,
              content: draft.content,
              cover_image_url: draft.cover_image_url || null,
              cover_image_alt: draft.cover_image_alt.trim() || null,
              author_id: draft.author_id || null,
              status: draft.status,
              published_at: publishedAtPayload(),
              target_country_code: draft.target_country_code.trim() || null,
              target_state_region: draft.target_state_region.trim() || null,
              target_city: draft.target_city.trim() || null,
              meta_title: draft.meta_title.trim() || null,
              meta_description: draft.meta_description.trim() || null,
              canonical_url: draft.canonical_url.trim() || null,
              og_image_url: draft.og_image_url.trim() || null,
              noindex: draft.noindex,
            }),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok)
          throw new Error(
            createResponse.error ?? "Couldn't create the article."
          )

        const newId = createResponse.id as string

        await Promise.all(
          draft.tagIds.map((id) => attachTag(newId, { tag_id: id }))
        )

        push({ title: "Article created", body: draft.title.trim() })
        router.push(`/admin/insights/${newId}`)
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
          {insight ? "Edit article" : "New article"}
        </h1>
        <Status tone="pending">{STATUS_LABEL[draft.status]}</Status>
        <span className="flex-1" />
        <ButtonLink
          href={insight ? `/admin/insights/${insight.id}` : "/admin/insights"}
          variant="secondary"
        >
          Cancel
        </ButtonLink>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : insight ? "Save changes" : "Create article"}
        </Button>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-(--cl-radius-md) border border-(--color-accent-2-300) bg-(--color-accent-2-100) px-4 py-3 text-[13px] text-(--color-accent-2-700) md:mx-7">
          {error}
        </div>
      ) : null}

      <div className="px-4 md:px-7">
        <SectionHead className="mt-5">Content</SectionHead>

        <FormField label="Title">
          <Input
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value
              set("title", title)
              if (!insight) set("slug", slugify(title))
            }}
            placeholder="What a go-down on Baba Dogo Road is really worth"
            className="text-[14px]"
          />
        </FormField>

        <FormField
          label="Slug"
          hint="The article's URL — entity.co.ke/insights/…"
        >
          <Input
            value={draft.slug}
            onChange={(e) => set("slug", slugify(e.target.value))}
            className="cl-fig text-[13.5px]"
          />
        </FormField>

        <FormField
          label="Summary"
          hint="Shown under the title and in article cards"
        >
          <Textarea
            value={draft.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="min-h-17.5 text-[13.5px]"
          />
        </FormField>

        <FormField label="Article body">
          <RichEditor
            key={insight?.id ?? "new"}
            defaultValue={draft.content}
            onChange={(html) => set("content", html)}
            placeholder="Begin writing…"
          />
        </FormField>

        <SectionHead className="mt-2">Cover image</SectionHead>

        <FormField
          label="Cover"
          hint="Shown at the top of the article and in cards"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Plate
              matted={false}
              src={draft.cover_image_url || undefined}
              alt={draft.cover_image_alt || draft.title}
              className="aspect-video w-full flex-none sm:w-55"
              label="No cover image"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <label className="cl-btn cl-btn-secondary inline-flex w-fit cursor-pointer items-center">
                {uploading
                  ? "Uploading…"
                  : draft.cover_image_url
                    ? "Replace image"
                    : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverUpload(file)
                    e.target.value = ""
                  }}
                />
              </label>
              {draft.cover_image_url ? (
                <button
                  type="button"
                  onClick={() => set("cover_image_url", "")}
                  className="w-fit text-[12.5px] text-(--color-accent-2) underline underline-offset-2"
                >
                  Remove image
                </button>
              ) : null}
              <Input
                value={draft.cover_image_alt}
                onChange={(e) => set("cover_image_alt", e.target.value)}
                placeholder="Alt text / caption"
                className="text-[13px]"
              />
            </div>
          </div>
        </FormField>

        <SectionHead className="mt-2">Filing</SectionHead>

        <FormField label="Author">
          <Select
            value={draft.author_id}
            onChange={(e) => set("author_id", e.target.value)}
            className="text-[13.5px]"
          >
            <option value="">No author set</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          {users.length === 0 ? (
            <K className="mt-2 text-neutral-600">
              Sign in to choose from the staff register.
            </K>
          ) : null}
        </FormField>

        <FormField label="Status">
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as ContentStatus)}
              className="w-42.5 text-[13.5px]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
            {draft.status === "published" ? (
              <Input
                type="datetime-local"
                value={draft.published_at}
                onChange={(e) => set("published_at", e.target.value)}
                className="w-55 text-[13px]"
              />
            ) : null}
          </div>
          {draft.status === "published" ? (
            <K className="mt-2 text-neutral-600">
              Leave the date blank to publish as of now.
            </K>
          ) : null}
        </FormField>

        <FormField label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 ? (
              <span className="text-[13px] text-neutral-600">
                No tags yet — add the first one below.
              </span>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    draft.tagIds.includes(tag.id)
                      ? "cl-tag cl-tag-accent"
                      : "cl-tag cl-tag-outline"
                  }
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="w-50 text-[13px]"
            />
            <Button type="button" variant="secondary" onClick={handleAddTag}>
              Add tag
            </Button>
          </div>
        </FormField>

        <FormField label="Targeting" hint="Optional — for geo-targeted content">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Input
              value={draft.target_country_code}
              onChange={(e) => set("target_country_code", e.target.value)}
              placeholder="Country code, e.g. KE"
              className="text-[13px]"
            />
            <Input
              value={draft.target_state_region}
              onChange={(e) => set("target_state_region", e.target.value)}
              placeholder="Region, e.g. Nairobi County"
              className="text-[13px]"
            />
            <Input
              value={draft.target_city}
              onChange={(e) => set("target_city", e.target.value)}
              placeholder="City, e.g. Nairobi"
              className="text-[13px]"
            />
          </div>
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

        <FormField
          label="Canonical URL"
          hint="Only if this content is published elsewhere too"
        >
          <Input
            value={draft.canonical_url}
            onChange={(e) => set("canonical_url", e.target.value)}
            placeholder="https://…"
            className="text-[13px]"
          />
        </FormField>

        <FormField
          label="Social share image"
          hint="Falls back to the cover image if left blank"
        >
          <Input
            value={draft.og_image_url}
            onChange={(e) => set("og_image_url", e.target.value)}
            placeholder="https://…"
            className="text-[13px]"
          />
        </FormField>

        <FormField label="Indexing">
          <label className="flex items-center gap-2.5 text-[13.5px]">
            <input
              type="checkbox"
              checked={draft.noindex}
              onChange={(e) => set("noindex", e.target.checked)}
            />
            Hide this article from search engines
          </label>
        </FormField>

        <div className="flex items-center justify-end gap-3 py-7">
          <ButtonLink
            href={insight ? `/admin/insights/${insight.id}` : "/admin/insights"}
            variant="secondary"
          >
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : insight ? "Save changes" : "Create article"}
          </Button>
        </div>
      </div>
    </form>
  )
}
