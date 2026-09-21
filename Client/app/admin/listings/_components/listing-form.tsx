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
import { useListingContext } from "../../../_lib/Context/Listing"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useCurrencyContext } from "../../../_lib/Context/Currencies"
import { useMediaContext } from "../../../_lib/Context/Media"
import { uploadImage } from "../../../_lib/uploadImage"
import { slugify } from "../../../_lib/format"
import type {
  AreaUnit,
  ListingPurpose,
  ListingStatus,
  ListingWithMedia,
  PricePeriod,
  PropertySubtype,
  PropertyType,
} from "../../../_lib/Types/Listing"
import {
  PROPERTY_TYPE_LABEL,
  STATUS_LABEL,
  SUBTYPES_BY_TYPE,
  suggestReferenceCode,
  titleCase,
} from "../_lib"

type FeatureRow = { key: string; value: string }

type Photo = {
  id?: string // present once persisted (edit mode only)
  type: "image" | "video"
  url: string
  provider_public_id: string | null
  width: number | null
  height: number | null
  bytes: number | null
  duration_seconds: number | null
  alt_text: string
  caption: string
}

type Draft = {
  title: string
  reference_code: string
  slug: string
  property_type: PropertyType
  property_subtype: string
  purpose: ListingPurpose
  status: ListingStatus
  summary: string
  description: string
  country_code: string
  state_region: string
  city: string
  neighbourhood: string
  location_label: string
  address_line: string
  postal_code: string
  latitude: string
  longitude: string
  price: string
  currency_code: string
  price_period: PricePeriod
  price_on_request: boolean
  service_charge: string
  service_charge_period: string
  bedrooms: string
  bathrooms: string
  parking_spaces: string
  floor_area: string
  floor_area_unit: string
  land_area: string
  land_area_unit: string
  floors: string
  year_built: string
  agent_id: string
  is_exclusive: boolean
  is_featured: boolean
  meta_title: string
  meta_description: string
  og_image_url: string
  canonical_url: string
  noindex: boolean
  published_at: string
  sold_at: string
}

function numToStr(n: number | null): string {
  return n == null ? "" : String(n)
}

function draftFrom(listing?: ListingWithMedia): Draft {
  return {
    title: listing?.title ?? "",
    reference_code: listing?.reference_code ?? "",
    slug: listing?.slug ?? "",
    property_type: listing?.property_type ?? "residential",
    property_subtype: listing?.property_subtype ?? "",
    purpose: listing?.purpose ?? "sale",
    status: listing?.status ?? "draft",
    summary: listing?.summary ?? "",
    description: listing?.description ?? "",
    country_code: listing?.country_code ?? "KE",
    state_region: listing?.state_region ?? "",
    city: listing?.city ?? "",
    neighbourhood: listing?.neighbourhood ?? "",
    location_label: listing?.location_label ?? "",
    address_line: listing?.address_line ?? "",
    postal_code: listing?.postal_code ?? "",
    latitude: numToStr(listing?.latitude ?? null),
    longitude: numToStr(listing?.longitude ?? null),
    price: numToStr(listing?.price ?? null),
    currency_code: listing?.currency_code ?? "KES",
    price_period: listing?.price_period ?? "total",
    price_on_request: listing?.price_on_request ?? false,
    service_charge: numToStr(listing?.service_charge ?? null),
    service_charge_period: listing?.service_charge_period ?? "",
    bedrooms: numToStr(listing?.bedrooms ?? null),
    bathrooms: numToStr(listing?.bathrooms ?? null),
    parking_spaces: numToStr(listing?.parking_spaces ?? null),
    floor_area: numToStr(listing?.floor_area ?? null),
    floor_area_unit: listing?.floor_area_unit ?? "",
    land_area: numToStr(listing?.land_area ?? null),
    land_area_unit: listing?.land_area_unit ?? "",
    floors: numToStr(listing?.floors ?? null),
    year_built: numToStr(listing?.year_built ?? null),
    agent_id: listing?.agent_id ?? "",
    is_exclusive: listing?.is_exclusive ?? false,
    is_featured: listing?.is_featured ?? false,
    meta_title: listing?.meta_title ?? "",
    meta_description: listing?.meta_description ?? "",
    og_image_url: listing?.og_image_url ?? "",
    canonical_url: listing?.canonical_url ?? "",
    noindex: listing?.noindex ?? false,
    published_at: listing?.published_at
      ? new Date(listing.published_at).toISOString().slice(0, 16)
      : "",
    sold_at: listing?.sold_at
      ? new Date(listing.sold_at).toISOString().slice(0, 16)
      : "",
  }
}

function photosFrom(listing?: ListingWithMedia): Photo[] {
  return (listing?.media ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      id: m.id,
      type: m.type === "video" ? ("video" as const) : ("image" as const),
      url: m.url,
      provider_public_id: m.provider_public_id,
      width: m.width,
      height: m.height,
      bytes: m.bytes,
      duration_seconds: m.duration_seconds,
      alt_text: m.alt_text ?? "",
      caption: m.caption ?? "",
    }))
}

const SERVICE_CHARGE_PERIODS: PricePeriod[] = [
  "total",
  "per_month",
  "per_year",
  "per_sqft_month",
  "per_sqft_year",
  "per_acre",
]

const AREA_UNITS: AreaUnit[] = ["sqft", "sqm", "acre", "hectare"]

export function ListingForm({ listing }: { listing?: ListingWithMedia }) {
  const {
      listings,
      createListing: _create,
      editListing,
      fetchListings,
    } = useListingContext(),
    { agents } = useAgentContext(),
    { currencies } = useCurrencyContext(),
    { createMedia, deleteMedia } = useMediaContext(),
    push = useToast(),
    router = useRouter()

  void _create // creation goes through a raw fetch below to recover the new id

  const [draft, setDraft] = React.useState<Draft>(() => draftFrom(listing)),
    [photos, setPhotos] = React.useState<Photo[]>(() => photosFrom(listing)),
    [features, setFeatures] = React.useState<FeatureRow[]>(() =>
      Object.entries(listing?.features ?? {}).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    ),
    [saving, setSaving] = React.useState(false),
    [uploading, setUploading] = React.useState(false),
    [error, setError] = React.useState<string | null>(null)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const subtypeOptions = SUBTYPES_BY_TYPE[draft.property_type]

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file, "listing")
      const type: Photo["type"] =
        result.resourceType === "video" ? "video" : "image"

      const photo: Photo = {
        type,
        url: result.url,
        provider_public_id: result.publicId,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        duration_seconds: result.durationSeconds,
        alt_text: "",
        caption: "",
      }

      // The cover shown on cards/thumbnails everywhere else has to be a
      // photo — a video only becomes primary if there's no image yet
      // either, which just keeps the very first upload marked as cover.
      const isPrimary =
        type === "image"
          ? !photos.some((p) => p.type === "image")
          : photos.length === 0

      if (listing) {
        await createMedia({
          listing_id: listing.id,
          type: photo.type,
          url: photo.url,
          provider_public_id: photo.provider_public_id,
          width: photo.width,
          height: photo.height,
          bytes: photo.bytes,
          duration_seconds: photo.duration_seconds,
          is_primary: isPrimary,
          sort_order: photos.length,
        })
      }

      setPhotos((p) => [...p, photo])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handlePhotoRemove(index: number) {
    const photo = photos[index]
    if (listing && photo.id) {
      try {
        await deleteMedia(photo.id)
      } catch (err) {
        push({
          title: "Couldn't remove that photo",
          body: (err as Error).message,
        })
        return
      }
    }
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  function addFeatureRow() {
    setFeatures((f) => [...f, { key: "", value: "" }])
  }

  function updateFeatureRow(index: number, patch: Partial<FeatureRow>) {
    setFeatures((f) =>
      f.map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  function removeFeatureRow(index: number) {
    setFeatures((f) => f.filter((_, i) => i !== index))
  }

  function featuresPayload(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const row of features) {
      if (row.key.trim()) out[row.key.trim()] = row.value
    }
    return out
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

    if (
      !draft.title.trim() ||
      !draft.reference_code.trim() ||
      !draft.slug.trim() ||
      !draft.description.trim() ||
      !draft.location_label.trim() ||
      !draft.agent_id
    ) {
      setError(
        "Title, reference code, slug, description, location label and an assigned agent are all required."
      )
      return
    }

    if (!draft.price_on_request && !draft.price.trim()) {
      setError("A price is required unless this listing is priced on request.")
      return
    }

    if (!!draft.floor_area.trim() !== !!draft.floor_area_unit) {
      setError("Floor area and its unit must be given together.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: draft.title.trim(),
        reference_code: draft.reference_code.trim(),
        slug: draft.slug.trim(),
        property_type: draft.property_type,
        property_subtype: (draft.property_subtype ||
          null) as PropertySubtype | null,
        purpose: draft.purpose,
        status: draft.status,
        summary: draft.summary.trim() || null,
        description: draft.description.trim(),
        country_code: draft.country_code.trim() || "KE",
        state_region: draft.state_region.trim() || null,
        city: draft.city.trim() || null,
        neighbourhood: draft.neighbourhood.trim() || null,
        location_label: draft.location_label.trim(),
        address_line: draft.address_line.trim() || null,
        postal_code: draft.postal_code.trim() || null,
        latitude: draft.latitude.trim() ? Number(draft.latitude) : null,
        longitude: draft.longitude.trim() ? Number(draft.longitude) : null,
        price: draft.price_on_request ? null : Number(draft.price),
        currency_code: draft.currency_code,
        price_period: draft.price_period,
        price_on_request: draft.price_on_request,
        service_charge: draft.service_charge.trim()
          ? Number(draft.service_charge)
          : null,
        service_charge_period: (draft.service_charge_period ||
          null) as PricePeriod | null,
        bedrooms: draft.bedrooms.trim() ? Number(draft.bedrooms) : null,
        bathrooms: draft.bathrooms.trim() ? Number(draft.bathrooms) : null,
        parking_spaces: draft.parking_spaces.trim()
          ? Number(draft.parking_spaces)
          : null,
        floor_area: draft.floor_area.trim() ? Number(draft.floor_area) : null,
        floor_area_unit: draft.floor_area_unit
          ? (draft.floor_area_unit as AreaUnit)
          : null,
        land_area: draft.land_area.trim() ? Number(draft.land_area) : null,
        land_area_unit: draft.land_area_unit
          ? (draft.land_area_unit as AreaUnit)
          : null,
        floors: draft.floors.trim() ? Number(draft.floors) : null,
        year_built: draft.year_built.trim() ? Number(draft.year_built) : null,
        features: featuresPayload(),
        agent_id: draft.agent_id,
        is_exclusive: draft.is_exclusive,
        is_featured: draft.is_featured,
        meta_title: draft.meta_title.trim() || null,
        meta_description: draft.meta_description.trim() || null,
        og_image_url: draft.og_image_url.trim() || null,
        canonical_url: draft.canonical_url.trim() || null,
        noindex: draft.noindex,
        published_at: publishedAtPayload(),
        sold_at: draft.sold_at ? new Date(draft.sold_at).toISOString() : null,
      }

      if (listing) {
        await editListing(listing.id, payload)
        push({ title: "Listing saved", body: draft.title.trim() })
        router.push(`/admin/listings/${listing.id}`)
      } else {
        const createRequest = await fetch("/system/api/v1/listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              media: photos.map((p, index) => ({
                url: p.url,
                provider_public_id: p.provider_public_id,
                width: p.width,
                height: p.height,
                bytes: p.bytes,
                alt_text: p.alt_text.trim() || null,
                caption: p.caption.trim() || null,
                is_primary: index === 0,
                sort_order: index,
              })),
            }),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok)
          throw new Error(
            createResponse.error ?? "Couldn't create the listing."
          )

        await fetchListings()
        push({ title: "Listing created", body: draft.title.trim() })
        router.push(`/admin/listings/${createResponse.id}`)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const activeAgents = agents.filter((a) => a.is_active)

  return (
    <form onSubmit={handleSubmit} className="min-w-0">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7">
        <h1 className="m-0 text-[22px] font-normal">
          {listing ? "Edit listing" : "New listing"}
        </h1>
        <Status tone="pending">{STATUS_LABEL[draft.status]}</Status>
        <span className="flex-1" />
        <ButtonLink
          href={listing ? `/admin/listings/${listing.id}` : "/admin/listings"}
          variant="secondary"
        >
          Cancel
        </ButtonLink>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : listing ? "Save changes" : "Create listing"}
        </Button>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-(--cl-radius-md) border border-(--color-accent-2-300) bg-(--color-accent-2-100) px-4 py-3 text-[13px] text-(--color-accent-2-700) md:mx-7">
          {error}
        </div>
      ) : null}

      <div className="px-4 md:px-7">
        <SectionHead className="mt-5">Basics</SectionHead>

        <FormField label="Title">
          <Input
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value
              set("title", title)
              if (!listing) set("slug", slugify(title))
            }}
            placeholder="Go-down with rail siding, Mombasa Road"
            className="text-[14px]"
          />
        </FormField>

        <FormField
          label="Reference code"
          hint="Shown to clients and staff — must be unique"
        >
          <div className="flex gap-2">
            <Input
              value={draft.reference_code}
              onChange={(e) =>
                set("reference_code", e.target.value.toUpperCase())
              }
              className="cl-fig flex-1 text-[13.5px]"
            />
            {!listing ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  set(
                    "reference_code",
                    suggestReferenceCode(listings, draft.property_type)
                  )
                }
              >
                Suggest
              </Button>
            ) : null}
          </div>
        </FormField>

        <FormField label="Slug" hint="entity.co.ke/listings/…">
          <Input
            value={draft.slug}
            onChange={(e) => set("slug", slugify(e.target.value))}
            className="cl-fig text-[13.5px]"
          />
        </FormField>

        <FormField label="Property type">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((t) => (
              <label
                key={t}
                className={`cl-seg-opt cursor-pointer justify-center rounded-(--cl-radius-md) border px-3 py-2 text-center text-[13px] ${
                  draft.property_type === t
                    ? "border-(--color-accent) bg-(--color-accent-100)"
                    : "border-(--color-divider)"
                }`}
              >
                <input
                  type="radio"
                  name="property_type"
                  className="hidden"
                  checked={draft.property_type === t}
                  onChange={() => {
                    set("property_type", t)
                    set("property_subtype", "")
                  }}
                />
                {PROPERTY_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Property subtype" hint="Optional">
          <Select
            value={draft.property_subtype}
            onChange={(e) => set("property_subtype", e.target.value)}
            className="text-[13.5px]"
          >
            <option value="">No subtype set</option>
            {subtypeOptions.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Purpose">
          <Select
            value={draft.purpose}
            onChange={(e) => set("purpose", e.target.value as ListingPurpose)}
            className="text-[13.5px]"
          >
            <option value="sale">For sale</option>
            <option value="rent">To rent</option>
            <option value="lease">To lease</option>
          </Select>
        </FormField>

        <FormField label="Status">
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as ListingStatus)}
              className="w-47.5 text-[13.5px]"
            >
              {(Object.keys(STATUS_LABEL) as ListingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            {draft.status === "published" ? (
              <Input
                type="datetime-local"
                value={draft.published_at}
                onChange={(e) => set("published_at", e.target.value)}
                className="w-55 text-[13px]"
              />
            ) : null}
            {["sold", "rented"].includes(draft.status) ? (
              <Input
                type="datetime-local"
                value={draft.sold_at}
                onChange={(e) => set("sold_at", e.target.value)}
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

        <SectionHead className="mt-2">Description</SectionHead>

        <FormField label="Summary" hint="A short line for cards and listings">
          <Textarea
            value={draft.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="min-h-17.5 text-[13.5px]"
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-37.5 text-[13.5px]"
          />
        </FormField>

        <SectionHead className="mt-2">Location</SectionHead>

        <FormField
          label="Location label"
          hint="Shown publicly, e.g. “Mombasa Rd, Athi River”"
        >
          <Input
            value={draft.location_label}
            onChange={(e) => set("location_label", e.target.value)}
            className="text-[13.5px]"
          />
        </FormField>

        <FormField label="Country / region / city">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Input
              value={draft.country_code}
              onChange={(e) =>
                set("country_code", e.target.value.toUpperCase())
              }
              placeholder="KE"
              className="cl-fig text-[13px]"
            />
            <Input
              value={draft.state_region}
              onChange={(e) => set("state_region", e.target.value)}
              placeholder="Nairobi County"
              className="text-[13px]"
            />
            <Input
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Nairobi"
              className="text-[13px]"
            />
          </div>
        </FormField>

        <FormField label="Neighbourhood / address">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Input
              value={draft.neighbourhood}
              onChange={(e) => set("neighbourhood", e.target.value)}
              placeholder="Athi River"
              className="text-[13px]"
            />
            <Input
              value={draft.address_line}
              onChange={(e) => set("address_line", e.target.value)}
              placeholder="Plot 14, Mombasa Road"
              className="text-[13px]"
            />
          </div>
        </FormField>

        <FormField label="Postal code / coordinates" hint="Optional">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Input
              value={draft.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              className="text-[13px]"
            />
            <Input
              value={draft.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="Latitude"
              className="cl-fig text-[13px]"
            />
            <Input
              value={draft.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="Longitude"
              className="cl-fig text-[13px]"
            />
          </div>
        </FormField>

        <SectionHead className="mt-2">Price</SectionHead>

        <FormField label="Price on request">
          <label className="flex items-center gap-2.5 text-[13.5px]">
            <input
              type="checkbox"
              checked={draft.price_on_request}
              onChange={(e) => set("price_on_request", e.target.checked)}
            />
            Hide the figure and show “price on request”
          </label>
        </FormField>

        {!draft.price_on_request ? (
          <FormField label="Price">
            <div className="flex gap-2">
              <Select
                value={draft.currency_code}
                onChange={(e) => set("currency_code", e.target.value)}
                className="w-25 flex-none text-[13.5px]"
              >
                {(currencies.length > 0
                  ? currencies
                  : [{ code: "KES", name: "Kenya Shilling" }]
                ).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </Select>
              <Input
                value={draft.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0"
                className="cl-fig flex-1 text-[13.5px]"
              />
              <Select
                value={draft.price_period}
                onChange={(e) =>
                  set("price_period", e.target.value as PricePeriod)
                }
                className="w-37.5 flex-none text-[13.5px]"
              >
                <option value="total">Total</option>
                <option value="per_month">/ month</option>
                <option value="per_year">/ year</option>
                <option value="per_sqft_month">/ sq ft / month</option>
                <option value="per_sqft_year">/ sq ft / year</option>
                <option value="per_acre">/ acre</option>
              </Select>
            </div>
          </FormField>
        ) : null}

        <FormField label="Service charge" hint="Optional">
          <div className="flex gap-2">
            <Input
              value={draft.service_charge}
              onChange={(e) => set("service_charge", e.target.value)}
              placeholder="0"
              className="cl-fig flex-1 text-[13.5px]"
            />
            <Select
              value={draft.service_charge_period}
              onChange={(e) => set("service_charge_period", e.target.value)}
              className="w-37.5 flex-none text-[13.5px]"
            >
              <option value="">No period set</option>
              {SERVICE_CHARGE_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
        </FormField>

        <SectionHead className="mt-2">Specification</SectionHead>

        <FormField label="Bedrooms / bathrooms / parking" hint="Optional">
          <div className="grid grid-cols-3 gap-2.5">
            <Input
              value={draft.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
              className="cl-fig text-[13.5px]"
              inputMode="numeric"
            />
            <Input
              value={draft.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
              className="cl-fig text-[13.5px]"
              inputMode="numeric"
            />
            <Input
              value={draft.parking_spaces}
              onChange={(e) => set("parking_spaces", e.target.value)}
              className="cl-fig text-[13.5px]"
              inputMode="numeric"
            />
          </div>
        </FormField>

        <FormField
          label="Floor area"
          hint="Unit is required if an area is given"
        >
          <div className="flex gap-2">
            <Input
              value={draft.floor_area}
              onChange={(e) => set("floor_area", e.target.value)}
              className="cl-fig flex-1 text-[13.5px]"
              inputMode="decimal"
            />
            <Select
              value={draft.floor_area_unit}
              onChange={(e) => set("floor_area_unit", e.target.value)}
              className="w-32.5 flex-none text-[13.5px]"
            >
              <option value="">No unit</option>
              {AREA_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        </FormField>

        <FormField label="Land area" hint="Optional">
          <div className="flex gap-2">
            <Input
              value={draft.land_area}
              onChange={(e) => set("land_area", e.target.value)}
              className="cl-fig flex-1 text-[13.5px]"
              inputMode="decimal"
            />
            <Select
              value={draft.land_area_unit}
              onChange={(e) => set("land_area_unit", e.target.value)}
              className="w-32.5 flex-none text-[13.5px]"
            >
              <option value="">No unit</option>
              {AREA_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        </FormField>

        <FormField label="Floors / year built" hint="Optional">
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              value={draft.floors}
              onChange={(e) => set("floors", e.target.value)}
              className="cl-fig text-[13.5px]"
              inputMode="numeric"
            />
            <Input
              value={draft.year_built}
              onChange={(e) => set("year_built", e.target.value)}
              className="cl-fig text-[13.5px]"
              inputMode="numeric"
            />
          </div>
        </FormField>

        <FormField
          label="Additional features"
          hint="Free-form, e.g. parking, backup power"
        >
          <div className="flex flex-col gap-2">
            {features.map((row, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={row.key}
                  onChange={(e) =>
                    updateFeatureRow(index, { key: e.target.value })
                  }
                  placeholder="Label"
                  className="flex-1 text-[13px]"
                />
                <Input
                  value={row.value}
                  onChange={(e) =>
                    updateFeatureRow(index, { value: e.target.value })
                  }
                  placeholder="Value"
                  className="flex-1 text-[13px]"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => removeFeatureRow(index)}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addFeatureRow}
              className="w-fit"
            >
              + Add a feature
            </Button>
          </div>
        </FormField>

        <SectionHead className="mt-2">Photos &amp; video</SectionHead>

        <FormField
          label="Plates"
          hint="First photo is the cover — a video is never used as one"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {photos.map((photo, index) => {
              const isPrimary =
                photo.type === "image" &&
                photos.slice(0, index).every((p) => p.type !== "image")

              return (
                <div
                  key={photo.id ?? photo.url}
                  className="flex flex-col gap-1.5"
                >
                  {photo.type === "video" ? (
                    <video
                      src={photo.url}
                      controls
                      muted
                      preload="metadata"
                      className="aspect-4/3 w-full rounded-(--cl-radius-md) bg-black object-cover"
                    />
                  ) : (
                    <Plate
                      matted={false}
                      src={photo.url}
                      alt={photo.alt_text || draft.title}
                      className="aspect-4/3"
                    />
                  )}
                  <Input
                    value={photo.alt_text}
                    onChange={(e) =>
                      setPhotos((p) =>
                        p.map((row, i) =>
                          i === index
                            ? { ...row, alt_text: e.target.value }
                            : row
                        )
                      )
                    }
                    placeholder={
                      photo.type === "video" ? "Caption" : "Alt text"
                    }
                    className="text-[12px]"
                  />
                  <div className="flex items-center justify-between">
                    <K>
                      {photo.type === "video"
                        ? "Video"
                        : isPrimary
                          ? "Cover"
                          : `Plate ${index + 1}`}
                    </K>
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(index)}
                      className="text-[11.5px] text-(--color-accent-2) underline underline-offset-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
            <label className="grid aspect-4/3 cursor-pointer place-items-center rounded-(--cl-radius-md) border border-dashed border-(--color-divider) hover:border-(--color-accent)">
              <span className="cl-k text-neutral-600">
                {uploading ? "Uploading…" : "+ Add photo or video"}
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoUpload(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>
        </FormField>

        <SectionHead className="mt-2">Assignment & flags</SectionHead>

        <FormField label="Agent">
          <Select
            value={draft.agent_id}
            onChange={(e) => set("agent_id", e.target.value)}
            className="text-[13.5px]"
          >
            <option value="">Select an agent</option>
            {activeAgents.map((a) => (
              <option key={a.id} value={a.user_id}>
                {a.display_name}
              </option>
            ))}
          </Select>
          {activeAgents.length === 0 ? (
            <K className="mt-2 text-neutral-600">
              Sign in to choose from the agent register.
            </K>
          ) : null}
        </FormField>

        <FormField label="Flags">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={draft.is_exclusive}
                onChange={(e) => set("is_exclusive", e.target.checked)}
              />
              Sole / exclusive mandate
            </label>
            <label className="flex items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={draft.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
              />
              Feature on the site
            </label>
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
          label="Social share image"
          hint="Falls back to the cover photo if left blank"
        >
          <Input
            value={draft.og_image_url}
            onChange={(e) => set("og_image_url", e.target.value)}
            placeholder="https://…"
            className="text-[13px]"
          />
        </FormField>

        <FormField
          label="Canonical URL"
          hint="Only if this listing is published elsewhere too"
        >
          <Input
            value={draft.canonical_url}
            onChange={(e) => set("canonical_url", e.target.value)}
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
            Hide this listing from search engines
          </label>
        </FormField>

        <div className="flex items-center justify-end gap-3 py-7">
          <ButtonLink
            href={listing ? `/admin/listings/${listing.id}` : "/admin/listings"}
            variant="secondary"
          >
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : listing ? "Save changes" : "Create listing"}
          </Button>
        </div>
      </div>
    </form>
  )
}
