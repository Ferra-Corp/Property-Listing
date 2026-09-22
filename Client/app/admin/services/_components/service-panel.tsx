"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Plate } from "../../../_components/ui/plate"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import { useServiceContext } from "../../../_lib/Context/Service"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { usePermission } from "../../../_lib/permissions"
import { bySortOrder, dateLabel, statusLabel, statusTone } from "../_lib"

export function ServicePanel({ id }: { id: string }) {
  const { services, loading } = useServiceContext(),
    { logs } = useLogsContext(),
    canEdit = usePermission("Edit service"),
    router = useRouter()

  const ordered = bySortOrder(services),
    index = ordered.findIndex((s) => s.id === id),
    service = ordered[index]

  if (!service) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
        {loading ? "Loading…" : "Service not found."}
      </div>
    )
  }

  const prev = index > 0 ? ordered[index - 1] : null,
    next = index < ordered.length - 1 ? ordered[index + 1] : null,
    activity = logs
      .filter((l) => l.entity_type === "Service" && l.entity_id === service.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6)

  const metaTitle = service.meta_title ?? service.title,
    metaDescription = service.meta_description ?? service.summary ?? ""

  return (
    <div className="bg-neutral-100">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-neutral-100)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-5.5">
        <K className="cl-fig min-w-0 flex-1 truncate">
          Service · position {index + 1} of {ordered.length}
        </K>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Previous"
          disabled={!prev}
          onClick={() => prev && router.push(`/admin/services/${prev.id}`)}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Next"
          disabled={!next}
          onClick={() => next && router.push(`/admin/services/${next.id}`)}
        >
          ↓
        </Button>
        <ButtonLink
          href="/admin/services"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Close"
        >
          ×
        </ButtonLink>
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[27px] leading-[1.2] font-normal">
              {service.title}
            </h2>
            <K className="cl-fig mt-2">{service.slug}</K>
          </div>
          <Status tone={statusTone(service)}>{statusLabel(service)}</Status>
        </div>

        <div className="mt-4 flex gap-2">
          {canEdit ? (
            <ButtonLink
              href={`/admin/services/${service.id}/edit`}
              variant="primary"
              className="flex-1"
            >
              Edit the copy
            </ButtonLink>
          ) : null}
          <ButtonLink
            href="/system/services"
            variant="secondary"
            className="flex-1"
          >
            Preview
          </ButtonLink>
        </div>

        {service.summary ? (
          <div className="mt-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) p-4">
            <K>Summary · shown under the heading</K>
            <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.75] md:text-[14px]">
              {service.summary}
            </p>
          </div>
        ) : null}
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Heading plate</SectionHead>
        {service.image_url ? (
          <Plate
            matted={false}
            src={service.image_url}
            alt={service.title}
            className="mt-3 aspect-video"
          />
        ) : (
          <div className="mt-3 text-[13px] text-neutral-600">
            No image set on this service yet.
          </div>
        )}
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Copy</SectionHead>
        {service.description ? (
          <p className="mt-3 mb-0 text-[13.5px] leading-[1.7] text-(--color-text)">
            {service.description}
          </p>
        ) : (
          <div className="mt-3 text-[13px] text-neutral-600">
            No fuller description written yet.
          </div>
        )}
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>How it will read in search</SectionHead>
        <div className="mt-3 rounded-(--cl-radius-md) border border-(--color-divider) bg-(--color-bg) px-3.75 py-3.25">
          <K>entity.co.ke › services</K>
          <div className="mt-1.5 text-[15px] leading-[1.35] text-(--color-accent-700)">
            {metaTitle}
          </div>
          <p className="mt-1.5 mb-0 text-[12.5px] leading-[1.6] text-neutral-700">
            {metaDescription || "No summary or meta description written yet."}
          </p>
        </div>
        <Pair label="Meta title">{metaTitle.length} of 60</Pair>
        <Pair label="Meta description">{metaDescription.length} of 160</Pair>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>On file</SectionHead>
        <Pair label="Position">
          {index + 1} of {ordered.length}
        </Pair>
        <Pair label="Icon key">{service.icon ?? "None set"}</Pair>
        <Pair label="Added">{dateLabel(service.created_at)}</Pair>
        <Pair label="Last edited">{dateLabel(service.updated_at)}</Pair>
      </div>

      <div className="px-4 pt-4.5 pb-7 md:px-5.5">
        <SectionHead>Activity</SectionHead>
        {activity.length === 0 ? (
          <div className="mt-3 text-[13px] text-neutral-600">
            No recorded activity for this service yet.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {activity.map((log) => (
              <Link
                key={log.id}
                href={`/admin/audit-log/${log.id}`}
                className="flex gap-3 hover:text-(--color-accent-700)"
              >
                <span className="cl-fig cl-k w-22 flex-none text-(--color-accent)">
                  {dateLabel(log.created_at)}
                </span>
                <div className="text-[13px] leading-[1.55]">{log.action}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
