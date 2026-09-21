"use client"

import * as React from "react"
import Link from "next/link"
import { PageIn } from "../_components/Admin/motion"
import {
  K,
  SectionHead,
  Status,
  type StatusTone,
} from "../_components/Admin/ui"
import { useListingContext } from "../_lib/Context/Listing"
import { useLeadContext } from "../_lib/Context/Lead"
import { useViewingContext } from "../_lib/Context/Viewing Request"
import { useValuationContext } from "../_lib/Context/Valuation Request"
import { useAgentContext } from "../_lib/Context/Agent"
import { useInsightContext } from "../_lib/Context/Insight"
import { useUserContext } from "../_lib/Context/User"

// ── helpers ────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function thisMonthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function relativeDay(iso: string): string {
  const d = new Date(iso),
    now = new Date(),
    diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function fmt(n: number): string {
  return n.toLocaleString("en-KE")
}

// ── weather widget ─────────────────────────────────────────────────────────
// Open-Meteo — no API key, Nairobi coords

type Weather = {
  temp: number
  code: number
  wind: number
}

const WMO_LABEL: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Thunderstorm + hail",
}

const WMO_ICON: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "🌨️",
  80: "🌦️",
  81: "🌦️",
  82: "⛈️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
}

function weatherIcon(code: number): string {
  return WMO_ICON[code] ?? "🌡️"
}
function weatherLabel(code: number): string {
  return WMO_LABEL[code] ?? "Unknown"
}

function WeatherWidget() {
  const [wx, setWx] = React.useState<Weather | null>(null)
  const [err, setErr] = React.useState(false)

  React.useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=Africa%2FNairobi"
    )
      .then((r) => r.json())
      .then((d) => {
        setWx({
          temp: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
          wind: Math.round(d.current.wind_speed_10m),
        })
      })
      .catch(() => setErr(true))
  }, [])

  if (err || !wx) {
    return (
      <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-neutral-500)]">
        <span>📍 Nairobi</span>
        {err ? <span>· weather unavailable</span> : <span>· loading…</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-[12.5px] text-[var(--color-neutral-600)]">
      <span className="text-[18px] leading-none" aria-hidden>
        {weatherIcon(wx.code)}
      </span>
      <span>
        {wx.temp}°C · {weatherLabel(wx.code)}
      </span>
      <span className="text-[var(--color-neutral-400)]">·</span>
      <span>Wind {wx.wind} km/h</span>
      <span className="text-[var(--color-neutral-400)]">·</span>
      <span>Nairobi</span>
    </div>
  )
}

// ── stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  href: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-2 rounded-[var(--cl-radius-lg)] border p-5 transition-colors hover:bg-[var(--color-neutral-100)] ${
        accent
          ? "border-[var(--color-accent)] bg-[var(--color-accent-100)]"
          : "border-[var(--color-divider)] bg-[var(--color-bg)]"
      }`}
    >
      <K className="text-[10.5px] tracking-[0.14em]">{label}</K>
      <div
        className={`font-(family-name:--font-heading) text-[32px] leading-none ${
          accent ? "text-[var(--color-accent-800)]" : "text-[var(--color-text)]"
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div className="cl-k text-[var(--color-neutral-500)]">{sub}</div>
      ) : null}
    </Link>
  )
}

// ── activity row ───────────────────────────────────────────────────────────

function ActivityRow({
  label,
  meta,
  when,
  tone,
  status,
  href,
}: {
  label: string
  meta?: string
  when: string
  tone?: StatusTone
  status?: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="-mx-px flex items-start gap-3 border-b border-[var(--color-divider)] px-px py-3 text-[var(--color-text)] last:border-0 hover:bg-[var(--color-neutral-100)]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px]">{label}</div>
        {meta ? <K className="mt-0.5 truncate">{meta}</K> : null}
      </div>
      <div className="flex flex-none flex-col items-end gap-1.5">
        {tone && status ? <Status tone={tone}>{status}</Status> : null}
        <span className="cl-k cl-fig text-[var(--color-neutral-400)]">
          {when}
        </span>
      </div>
    </Link>
  )
}

// ── section shell ──────────────────────────────────────────────────────────

function Section({
  title,
  href,
  linkLabel = "View all",
  children,
}: {
  title: string
  href: string
  linkLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-bg)]">
      <div className="flex items-center gap-3 border-b border-[var(--color-divider)] px-5 py-3.5">
        <SectionHead className="flex-1 border-0 pb-0">{title}</SectionHead>
        <Link
          href={href}
          className="cl-k text-[10.5px] tracking-[0.12em] text-[var(--color-accent)] hover:underline"
        >
          {linkLabel} →
        </Link>
      </div>
      <div className="px-5 pb-1">{children}</div>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

const LEAD_STATUS_TONE: Record<string, StatusTone> = {
  new: "pending",
  contacted: "neutral",
  qualified: "published",
  viewing_booked: "published",
  negotiating: "mark",
  won: "published",
  lost: "outline",
  spam: "outline",
}

const REQUEST_STATUS_TONE: Record<string, StatusTone> = {
  pending: "pending",
  confirmed: "published",
  completed: "neutral",
  cancelled: "outline",
  no_show: "mark",
}

const LISTING_STATUS_TONE: Record<string, StatusTone> = {
  draft: "outline",
  pending_review: "pending",
  published: "published",
  under_offer: "mark",
  sold: "neutral",
  rented: "neutral",
  withdrawn: "outline",
}

export default function AdminDashboard() {
  const { currentUser } = useUserContext()
  const { listings } = useListingContext()
  const { leads } = useLeadContext()
  const { viewingRequests } = useViewingContext()
  const { valuationRequests } = useValuationContext()
  const { agents } = useAgentContext()
  const { insights } = useInsightContext()

  const monthStart = thisMonthStart()

  // ── listing stats ──
  const publishedListings = listings.filter((l) => l.status === "published")
  const listingsThisMonth = listings.filter(
    (l) => new Date(l.created_at) >= monthStart
  )
  const draftListings = listings.filter((l) => l.status === "draft")
  const underOfferListings = listings.filter((l) => l.status === "under_offer")

  // ── lead stats ──
  const newLeads = leads.filter((l) => l.status === "new")
  const leadsThisMonth = leads.filter(
    (l) => new Date(l.created_at) >= monthStart
  )
  const openLeads = leads.filter((l) =>
    ["new", "contacted", "qualified", "viewing_booked", "negotiating"].includes(
      l.status
    )
  )

  // ── viewing stats ──
  const pendingViewings = viewingRequests.filter((v) => v.status === "pending")
  const confirmedViewings = viewingRequests.filter(
    (v) => v.status === "confirmed"
  )

  // ── valuation stats ──
  const pendingValuations = valuationRequests.filter(
    (v) => v.status === "pending"
  )

  // ── agent stats ──
  const activeAgents = agents.filter((a) => a.is_active)

  // ── insight stats ──
  const publishedInsights = insights.filter((i) => i.status === "published")
  const totalViews = insights.reduce((s, i) => s + i.view_count, 0)

  // ── recent activity feeds (5 each) ──
  const recentListings = [...listings]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5)

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const recentViewings = [...viewingRequests]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const recentValuations = [...valuationRequests]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const dateStr = now.toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <PageIn>
      <div className="max-w-[1280px] px-4 py-6 md:px-7 md:py-8">
        {/* ── Header / greeting ── */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="m-0 font-(family-name:--font-heading) text-[28px] leading-tight font-normal md:text-[34px]">
              {greeting()}, {currentUser?.name ?? `D&amp;G.`}
            </h1>
            <div className="cl-k mt-2 text-[var(--color-neutral-500)]">
              {dateStr} · {timeStr}
            </div>
          </div>
          <WeatherWidget />
        </div>

        {/* ── Attention banners — unread new leads & pending viewings ── */}
        {(newLeads.length > 0 ||
          pendingViewings.length > 0 ||
          pendingValuations.length > 0) && (
          <div className="mb-6 flex flex-col gap-2.5">
            {newLeads.length > 0 && (
              <Link
                href="/admin/leads"
                className="flex items-center gap-3 rounded-[var(--cl-radius-lg)] border border-l-[3px] border-[var(--color-accent-2-300)] border-l-[var(--color-accent-2)] bg-[var(--color-accent-2-100)] px-4.5 py-3.5 transition-opacity hover:opacity-80"
              >
                <div className="flex-1">
                  <span className="cl-k text-[var(--color-accent-2-700)]">
                    Action needed
                  </span>
                  <div className="mt-0.5 text-[13.5px]">
                    {newLeads.length} new{" "}
                    {newLeads.length === 1 ? "lead" : "leads"} awaiting first
                    contact
                  </div>
                </div>
                <span className="cl-k text-[var(--color-accent-2-700)]">
                  Go to leads →
                </span>
              </Link>
            )}
            {pendingViewings.length > 0 && (
              <Link
                href="/admin/viewings"
                className="flex items-center gap-3 rounded-[var(--cl-radius-lg)] border border-l-[3px] border-[var(--color-accent-300)] border-l-[var(--color-accent)] bg-[var(--color-accent-100)] px-4.5 py-3.5 transition-opacity hover:opacity-80"
              >
                <div className="flex-1">
                  <span className="cl-k text-[var(--color-accent-800)]">
                    Pending confirmation
                  </span>
                  <div className="mt-0.5 text-[13.5px]">
                    {pendingViewings.length}{" "}
                    {pendingViewings.length === 1 ? "viewing" : "viewings"} not
                    yet confirmed
                  </div>
                </div>
                <span className="cl-k text-[var(--color-accent-800)]">
                  Go to viewings →
                </span>
              </Link>
            )}
            {pendingValuations.length > 0 && (
              <Link
                href="/admin/valuations"
                className="flex items-center gap-3 rounded-[var(--cl-radius-lg)] border border-l-[3px] border-[var(--color-neutral-300)] border-l-[var(--color-neutral-500)] bg-[var(--color-neutral-100)] px-4.5 py-3.5 transition-opacity hover:opacity-80"
              >
                <div className="flex-1">
                  <span className="cl-k text-[var(--color-neutral-700)]">
                    Pending
                  </span>
                  <div className="mt-0.5 text-[13.5px]">
                    {pendingValuations.length} valuation{" "}
                    {pendingValuations.length === 1 ? "request" : "requests"}{" "}
                    awaiting scheduling
                  </div>
                </div>
                <span className="cl-k text-[var(--color-neutral-700)]">
                  Go to valuations →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard
            label="Published listings"
            value={fmt(publishedListings.length)}
            sub={`${listingsThisMonth.length} added this month`}
            href="/admin/listings"
            accent
          />
          <StatCard
            label="Open leads"
            value={fmt(openLeads.length)}
            sub={`${leadsThisMonth.length} this month`}
            href="/admin/leads"
          />
          <StatCard
            label="Viewings"
            value={fmt(confirmedViewings.length)}
            sub={`${pendingViewings.length} pending`}
            href="/admin/viewings"
          />
          <StatCard
            label="Valuations"
            value={fmt(pendingValuations.length)}
            sub="pending scheduling"
            href="/admin/valuations"
          />
          <StatCard
            label="Active agents"
            value={fmt(activeAgents.length)}
            sub={`of ${fmt(agents.length)} on register`}
            href="/admin/agents"
          />
          <StatCard
            label="Insights"
            value={fmt(publishedInsights.length)}
            sub={`${fmt(totalViews)} total views`}
            href="/admin/insights"
          />
        </div>

        {/* ── Secondary stats strip ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-bg)] px-4 py-4">
            <K className="mb-1.5 text-[10.5px] tracking-[0.14em]">Drafts</K>
            <div className="cl-fig text-[22px] text-[var(--color-text)]">
              {fmt(draftListings.length)}
            </div>
            <K className="mt-1 text-[var(--color-neutral-400)]">
              listings unpublished
            </K>
          </div>
          <div className="rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-bg)] px-4 py-4">
            <K className="mb-1.5 text-[10.5px] tracking-[0.14em]">
              Under offer
            </K>
            <div className="cl-fig text-[22px] text-[var(--color-text)]">
              {fmt(underOfferListings.length)}
            </div>
            <K className="mt-1 text-[var(--color-neutral-400)]">
              listings in negotiation
            </K>
          </div>
          <div className="rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-bg)] px-4 py-4">
            <K className="mb-1.5 text-[10.5px] tracking-[0.14em]">
              New leads (uncontacted)
            </K>
            <div className="cl-fig text-[22px] text-[var(--color-text)]">
              {fmt(newLeads.length)}
            </div>
            <K className="mt-1 text-[var(--color-neutral-400)]">
              awaiting first touch
            </K>
          </div>
          <div className="rounded-[var(--cl-radius-lg)] border border-[var(--color-divider)] bg-[var(--color-bg)] px-4 py-4">
            <K className="mb-1.5 text-[10.5px] tracking-[0.14em]">
              Total leads
            </K>
            <div className="cl-fig text-[22px] text-[var(--color-text)]">
              {fmt(leads.length)}
            </div>
            <K className="mt-1 text-[var(--color-neutral-400)]">
              all time in the CRM
            </K>
          </div>
        </div>

        {/* ── Recent activity grid ── */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Recent listings */}
          <Section title="Recent listings" href="/admin/listings">
            {recentListings.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--color-neutral-500)]">
                No listings yet.
              </div>
            ) : (
              recentListings.map((l) => (
                <ActivityRow
                  key={l.id}
                  href={`/admin/listings/${l.id}`}
                  label={l.title}
                  meta={l.location_label}
                  when={relativeDay(l.updated_at)}
                  tone={LISTING_STATUS_TONE[l.status] ?? "neutral"}
                  status={l.status.replace("_", " ")}
                />
              ))
            )}
          </Section>

          {/* Recent leads */}
          <Section title="Recent leads" href="/admin/leads">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--color-neutral-500)]">
                No leads yet.
              </div>
            ) : (
              recentLeads.map((l) => (
                <ActivityRow
                  key={l.id}
                  href={`/admin/leads/${l.id}`}
                  label={l.full_name}
                  meta={l.phone}
                  when={relativeDay(l.created_at)}
                  tone={LEAD_STATUS_TONE[l.status] ?? "neutral"}
                  status={l.status.replace("_", " ")}
                />
              ))
            )}
          </Section>

          {/* Recent viewings */}
          <Section title="Recent viewings" href="/admin/viewings">
            {recentViewings.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--color-neutral-500)]">
                No viewing requests yet.
              </div>
            ) : (
              recentViewings.map((v) => (
                <ActivityRow
                  key={v.id}
                  href={`/admin/viewings/${v.id}`}
                  label={`Viewing · ${new Date(v.preferred_date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}
                  meta={v.preferred_time_slot ?? undefined}
                  when={relativeDay(v.created_at)}
                  tone={REQUEST_STATUS_TONE[v.status] ?? "neutral"}
                  status={v.status.replace("_", " ")}
                />
              ))
            )}
          </Section>

          {/* Recent valuations */}
          <Section title="Recent valuation requests" href="/admin/valuations">
            {recentValuations.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--color-neutral-500)]">
                No valuation requests yet.
              </div>
            ) : (
              recentValuations.map((v) => (
                <ActivityRow
                  key={v.id}
                  href={`/admin/valuations/${v.id}`}
                  label={v.location_label}
                  meta={`${v.property_type}${v.property_subtype ? ` · ${v.property_subtype}` : ""}`}
                  when={relativeDay(v.created_at)}
                  tone={REQUEST_STATUS_TONE[v.status] ?? "neutral"}
                  status={v.status.replace("_", " ")}
                />
              ))
            )}
          </Section>
        </div>

        {/* ── Footer note ── */}
        <div className="mt-8 border-t border-[var(--color-divider)] pt-5">
          <K className="text-center text-[var(--color-neutral-400)]">
            D&amp;G Realtors · Admin Desk · All figures are live from context
          </K>
        </div>
      </div>
    </PageIn>
  )
}
