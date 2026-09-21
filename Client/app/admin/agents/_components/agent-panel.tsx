"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Plate } from "../../../_components/ui/plate"
import { K, Pair, SectionHead, Status } from "../../../_components/Admin/ui"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useLeadContext } from "../../../_lib/Context/Lead"
import { useViewingContext } from "../../../_lib/Context/Viewing Request"
import { useValuationContext } from "../../../_lib/Context/Valuation Request"
import { useUserContext } from "../../../_lib/Context/User"
import { useLogsContext } from "../../../_lib/Context/Audit"
import {
  initialsFor,
  listingsFor,
  openLeadsFor,
  openValuationsFor,
  patchFor,
  viewingsThisWeekFor,
} from "../_lib"

export function AgentPanel({ slug }: { slug: string }) {
  const { agents, loading } = useAgentContext(),
    { listings } = useListingContext(),
    { leads } = useLeadContext(),
    { viewingRequests } = useViewingContext(),
    { valuationRequests } = useValuationContext(),
    { users } = useUserContext(),
    { logs } = useLogsContext(),
    router = useRouter()

  const sorted = [...agents].sort((a, b) => a.display_name.localeCompare(b.display_name)),
    index = sorted.findIndex((a) => a.slug === slug),
    agent = sorted[index]

  if (!agent) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-[var(--color-neutral-600)] md:px-[22px]">
        {loading ? "Loading…" : `Agent "${slug}" not found.`}
      </div>
    )
  }

  const prev = index > 0 ? sorted[index - 1] : null,
    next = index < sorted.length - 1 ? sorted[index + 1] : null,
    firstName = agent.display_name.split(" ")[0],
    user = users.find((u) => u.id === agent.user_id),
    mandates = listingsFor(agent, listings),
    published = mandates.filter((l) => l.status === "published"),
    patch = patchFor(agent, listings),
    openLeads = openLeadsFor(agent, leads),
    thisWeeksViewings = viewingsThisWeekFor(agent, viewingRequests),
    openValuations = openValuationsFor(agent, valuationRequests),
    recentActivity = logs
      .filter((l) => l.user_id === agent.user_id)
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)

  return (
    <div className="bg-[var(--color-neutral-100)]">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-[var(--color-divider)] bg-[color-mix(in_srgb,var(--color-neutral-100)_94%,transparent)] px-4 py-4 backdrop-blur-[8px] md:px-[22px]">
        <K className="cl-fig">Agent · {agent.slug}</K>
        <span className="flex-1" />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-[30px] w-[30px]"
          title="Previous"
          disabled={!prev}
          onClick={() => prev && router.push(`/admin/agents/${prev.slug}`)}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-[30px] w-[30px]"
          title="Next"
          disabled={!next}
          onClick={() => next && router.push(`/admin/agents/${next.slug}`)}
        >
          ↓
        </Button>
        <ButtonLink
          href="/admin/agents"
          variant="secondary"
          size="icon"
          className="h-[30px] w-[30px]"
          title="Close"
        >
          ×
        </ButtonLink>
      </div>

      <div className="px-4 pt-5 md:px-[22px]">
        <div className="flex items-start gap-3.5">
          <Plate
            matted={false}
            src={agent.photo_url}
            alt={agent.display_name}
            className="h-[74px] w-[74px] flex-none rounded-full"
            label={initialsFor(agent.display_name)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[27px] leading-[1.15] font-normal">
              {agent.display_name}
            </h2>
            <K className="mt-1.5">{agent.title ?? "Agent"}</K>
            {agent.phone ? (
              <div className="cl-fig mt-1.5 text-[13px] text-[var(--color-neutral-700)]">
                {agent.phone}
              </div>
            ) : null}
          </div>
          <Status tone={agent.is_active ? "published" : "outline"}>
            {agent.is_active ? "Active" : "Inactive"}
          </Status>
        </div>

        <div className="mt-4 flex gap-2">
          <ButtonLink
            href={`/admin/agents/${agent.slug}/edit`}
            variant="primary"
            className="flex-1"
          >
            Edit profile
          </ButtonLink>
          <ButtonLink
            href={`/system/agents/${agent.slug}`}
            variant="secondary"
            className="flex-1"
          >
            View public page
          </ButtonLink>
        </div>

        <div className="mt-4 rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-bg)] p-4">
          <K>Public biography</K>
          <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.75] md:text-[14px]">
            {agent.bio || "No biography on file yet."}
          </p>
        </div>
      </div>

      <div className="px-4 pt-[18px] md:px-[22px]">
        <SectionHead>Contact & identity</SectionHead>
        <Pair label="WhatsApp">{agent.whatsapp_number ?? "Same as phone"}</Pair>
        <Pair label="Public email">{agent.email_public ?? "—"}</Pair>
        <Pair label="Licence no.">{agent.license_number ?? "—"}</Pair>
        <Pair label="Role">{user?.role ?? "—"}</Pair>
        <Pair label="Joined">
          {new Date(agent.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Pair>
      </div>

      <div className="px-4 pt-[18px] md:px-[22px]">
        <SectionHead>Patch & specialisms</SectionHead>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {patch.length === 0 && agent.specializations.length === 0 ? (
            <span className="text-[13px] text-[var(--color-neutral-600)]">
              No mandates or specialisms on file yet.
            </span>
          ) : null}
          {patch.map((area) => (
            <span key={area} className="cl-tag cl-tag-accent">
              {area}
            </span>
          ))}
          {agent.specializations.map((tag) => (
            <span key={tag} className="cl-tag cl-tag-outline">
              {tag}
            </span>
          ))}
        </div>
        {agent.languages.length > 0 ? (
          <K className="mt-2.5 text-[var(--color-neutral-600)]">
            Speaks {agent.languages.join(", ")}
          </K>
        ) : null}
      </div>

      <div className="px-4 pt-[18px] md:px-[22px]">
        <SectionHead>What {firstName} is holding</SectionHead>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {[
            { figure: published.length, label: "Live listings" },
            { figure: mandates.length, label: "Total mandates" },
            { figure: openLeads.length, label: "Open leads" },
            { figure: thisWeeksViewings.length, label: "Viewings this week" },
            { figure: openValuations.length, label: "Valuations open" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--cl-radius-md)] border border-[var(--color-divider)] bg-[var(--color-bg)] px-3.5 py-2.5"
            >
              <div className="cl-fig text-[24px] leading-none">
                {item.figure}
              </div>
              <K className="mt-1.5">{item.label}</K>
            </div>
          ))}
        </div>
        {agent.years_experience ? (
          <Pair label="Years of experience">{agent.years_experience}</Pair>
        ) : null}
      </div>

      <div className="px-4 pt-[18px] pb-7 md:px-[22px]">
        <SectionHead>Activity</SectionHead>
        {recentActivity.length === 0 ? (
          <div className="mt-3 text-[13px] text-[var(--color-neutral-600)]">
            No recorded activity for this account yet.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {recentActivity.map((log) => (
              <Link
                key={log.id}
                href={`/admin/audit-log/${log.id}`}
                className="flex gap-3 hover:text-[var(--color-accent-700)]"
              >
                <span className="cl-fig cl-k w-[88px] flex-none text-[var(--color-accent)]">
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
