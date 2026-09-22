"use client"

import { ButtonLink } from "../../../_components/ui/button"
import { Plate } from "../../../_components/ui/plate"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import Link from "next/link"
import { useUserContext } from "../../../_lib/Context/User"
import { useLogsContext } from "../../../_lib/Context/Audit"
import { usePermission } from "../../../_lib/permissions"
import { ROLE_LABEL, ROLE_TAG_CLASS, initialsFor } from "../_lib"

/** For staff with no agent profile — a plain account with back-office
 * reach and nothing public-facing (edited from StaffForm, same as agents). */
export function StaffPanel({ id }: { id: string }) {
  const { users, loading, currentUser } = useUserContext(),
    { logs } = useLogsContext(),
    canEditOthers = usePermission("Manage user roles")

  const user = users.find((u) => u.id === id)

  if (!user) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
        {loading ? "Loading…" : "Staff member not found."}
      </div>
    )
  }

  const recentActivity = logs
    .filter((l) => l.user_id === user.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  return (
    <div className="bg-neutral-100">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-neutral-100)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-5.5">
        <K className="cl-fig">Staff · {user.email}</K>
        <span className="flex-1" />
        <ButtonLink
          href="/admin/agents"
          variant="secondary"
          size="icon"
          className="h-7.5 w-7.5"
          title="Close"
        >
          ×
        </ButtonLink>
      </div>

      <div className="px-4 pt-5 md:px-5.5">
        <div className="flex items-start gap-3.5">
          <Plate
            matted={false}
            src={null}
            alt={user.name}
            className="h-18.5 w-18.5 flex-none rounded-full"
            label={initialsFor(user.name)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[27px] leading-[1.15] font-normal">
              {user.name}
            </h2>
            <span
              className={`cl-tag ${ROLE_TAG_CLASS[user.role]} mt-1.5 inline-block`}
            >
              {ROLE_LABEL[user.role]}
            </span>
          </div>
          <Status tone={user.is_active ? "published" : "outline"}>
            {user.is_active ? "Active" : "Inactive"}
          </Status>
        </div>

        <div className="mt-4">
          <ButtonLink
            href={`/admin/agents/${user.id}/edit`}
            variant="primary"
            block
          >
            {currentUser?.id === user.id || canEditOthers
              ? "Edit account"
              : "View account"}
          </ButtonLink>
        </div>

        <div className="mt-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) p-4">
          <K>Back-office reach only</K>
          <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.75] md:text-[14px]">
            This account has no public profile — it doesn&apos;t appear on the
            site and can&apos;t hold a listing mandate. Only agents do.
          </p>
        </div>
      </div>

      <div className="px-4 pt-4.5 md:px-5.5">
        <SectionHead>Contact & identity</SectionHead>
        <Pair label="Email">{user.email}</Pair>
        <Pair label="Phone">{user.phone ?? "—"}</Pair>
        <Pair label="Role">{ROLE_LABEL[user.role]}</Pair>
        <Pair label="Joined">
          {new Date(user.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Pair>
        <Pair label="Last signed in">
          {user.last_login_at
            ? new Date(user.last_login_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Never"}
        </Pair>
      </div>

      <div className="px-4 pt-4.5 pb-7 md:px-5.5">
        <SectionHead>Activity</SectionHead>
        {recentActivity.length === 0 ? (
          <div className="mt-3 text-[13px] text-neutral-600">
            No recorded activity for this account yet.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {recentActivity.map((log) => (
              <Link
                key={log.id}
                href={`/admin/audit-log/${log.id}`}
                className="flex gap-3 hover:text-(--color-accent-700)"
              >
                <span className="cl-fig cl-k w-22 flex-none text-(--color-accent)">
                  {new Date(log.created_at).toLocaleDateString("en-GB")}
                </span>
                <div className="text-[13px] leading-[1.55]">
                  {log.action} · {log.entity_type}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
