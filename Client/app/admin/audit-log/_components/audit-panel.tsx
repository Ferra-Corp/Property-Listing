"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Plate } from "../../../_components/ui/plate"
import { K, Status } from "../../../_components/Admin/ui"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { useUserContext } from "../../../_lib/Context/User"
import { displayValue, initialsFor, toneFor, userName } from "../_lib"

export function AuditPanel({ logId }: { logId: string }) {
  const { logs, loading } = useLogsContext(),
    { users } = useUserContext(),
    router = useRouter()

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const index = sorted.findIndex((l) => String(l.id) === logId),
    log = sorted[index]

  if (!log) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
        {loading
          ? "Loading…"
          : `Row ${logId} not found — it may be older than what has loaded.`}
      </div>
    )
  }

  const prev = index > 0 ? sorted[index - 1] : null,
    next = index < sorted.length - 1 ? sorted[index + 1] : null,
    name = userName(users, log.user_id),
    user = log.user_id ? users.find((u) => u.id === log.user_id) : null,
    changesEntries = Object.entries(log.changes ?? {})

  const neighbours = sorted
    .filter(
      (l) =>
        l.entity_type === log.entity_type &&
        l.entity_id === log.entity_id &&
        String(l.id) !== logId
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  return (
    <div className="bg-neutral-100">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-neutral-100)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-5.5">
        <K className="cl-fig">audit_logs · id {log.id}</K>
        <span className="flex-1" />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Previous (newer)"
          disabled={!prev}
          onClick={() => prev && router.push(`/admin/audit-log/${prev.id}`)}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Next (older)"
          disabled={!next}
          onClick={() => next && router.push(`/admin/audit-log/${next.id}`)}
        >
          ↓
        </Button>
        <ButtonLink
          href="/admin/audit-log"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Close"
        >
          ×
        </ButtonLink>
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <div className="flex items-center gap-2.5">
          <Status tone={toneFor(log.action)}>{log.action}</Status>
          <K className="text-neutral-600">entity_type · {log.entity_type}</K>
        </div>
        <h2 className="mt-3 mb-0 text-[20px] leading-[1.3] font-normal break-all">
          {log.entity_id}
        </h2>
        <K className="cl-fig mt-2.5 text-(--color-accent)">
          created_at · {new Date(log.created_at).toLocaleString("en-GB")}
        </K>
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <K className="border-b-2 border-(--color-text) pb-1.5 text-neutral-600">
          changes · {changesEntries.length} keys
        </K>
        {changesEntries.length === 0 ? (
          <div className="mt-3 text-[13px] text-neutral-600">
            No changes payload was recorded for this row.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {changesEntries.map(([field, value]) => (
              <div
                key={field}
                className="flex items-start justify-between gap-3 border-b border-(--color-divider) py-1.5 font-mono text-[12px] leading-[1.6]"
              >
                <span className="flex-none text-neutral-600">{field}</span>
                <span className="min-w-0 truncate text-right">
                  {displayValue(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <K className="border-b-2 border-(--color-text) pb-1.5 text-neutral-600">
          user_id · joined to users
        </K>
        <div className="mt-3.5 flex items-center gap-3">
          {name ? (
            <Plate
              matted={false}
              className="h-10.5 w-10.5 flex-none rounded-full"
              label={initialsFor(name)}
            />
          ) : (
            <div className="grid h-10.5 w-10.5 flex-none place-items-center rounded-full border border-dashed border-neutral-400 text-neutral-500">
              —
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px]">{name ?? "Unattributed"}</div>
            {user ? (
              <K className="mt-1.5 text-neutral-600">
                {user.email} · {user.role}
              </K>
            ) : null}
          </div>
        </div>
        {log.user_id ? (
          <div className="cl-pair mt-3">
            <span className="text-neutral-700">user_id</span>
            <span className="font-mono text-[11.5px]">{log.user_id}</span>
          </div>
        ) : null}
        <K className="mt-2 text-neutral-600">
          user_id is nullable — background writes come through unattributed.
        </K>
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <K className="border-b-2 border-(--color-text) pb-1.5 text-neutral-600">
          ip_address & user_agent
        </K>
        <div className="cl-pair mt-3">
          <span className="text-neutral-700">ip_address</span>
          <span className="cl-fig">{log.ip_address ?? "—"}</span>
        </div>
        <div className="cl-pair">
          <span className="text-neutral-700">user_agent</span>
          <span>{log.user_agent ?? "—"}</span>
        </div>
      </div>

      {neighbours.length > 0 ? (
        <div className="px-4 pt-5 md:px-5.5">
          <K className="border-b-2 border-(--color-text) pb-1.5 text-neutral-600">
            Same record, either side
          </K>
          <div className="mt-3.5 flex flex-col gap-3">
            {neighbours.map((n) => (
              <Link
                key={n.id}
                href={`/admin/audit-log/${n.id}`}
                className="flex gap-3 hover:text-(--color-accent-700)"
              >
                <span className="cl-fig cl-k w-25 flex-none text-neutral-500">
                  {new Date(n.created_at).toLocaleDateString("en-GB")}
                </span>
                <div className="text-[13px] leading-[1.55]">
                  {n.action} · {userName(users, n.user_id) ?? "unattributed"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="px-4 pt-5 pb-7 md:px-5.5">
        <K className="border-b-2 border-(--color-text) pb-1.5 text-neutral-600">
          The row as stored
        </K>
        <pre className="mt-3 overflow-x-auto rounded-(--cl-radius-md) border border-(--color-divider) bg-neutral-200 px-3.5 py-3 font-mono text-[11.5px] leading-[1.7] whitespace-pre-wrap text-neutral-800">
          {JSON.stringify(log, null, 2)}
        </pre>
        <p className="mt-3 mb-0 text-[13.5px] leading-[1.75] text-neutral-700">
          The table takes inserts only — there is no restore action here yet.
        </p>
      </div>
    </div>
  )
}
