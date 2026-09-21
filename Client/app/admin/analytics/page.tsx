"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis, // Added YAxis import
} from "recharts"
import { Button } from "../../_components/ui/button"
import { Select } from "../../_components/ui/field"
import { Pad } from "../../_components/Admin/admin-shell"
import { K } from "../../_components/Admin/ui"
import { PageIn, RowIn } from "../../_components/Admin/motion"
import { useLeadContext } from "../../_lib/Context/Lead"
import { useViewingContext } from "../../_lib/Context/Viewing Request"
import { useValuationContext } from "../../_lib/Context/Valuation Request"
import { useListingContext } from "../../_lib/Context/Listing"
import {
  byCity,
  dailyCounts,
  exportLeadsCsv,
  firstReplyMinutes,
  funnelStages,
  inRange,
  median,
  minutesLabel,
  mostRequestedTimeSlot,
  pctDelta,
  PERIOD_LABEL,
  periodRange,
  sourceBreakdown,
  valuationStats,
  daysLabel,
  type Period,
} from "./_lib"

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--color-neutral-900, #2a1c0e)",
  border: "1px solid var(--color-divider)",
  borderRadius: 6,
  fontSize: 12,
  padding: "8px 10px",
  color: "var(--color-bg)",
}

function Card({
  title,
  aside,
  children,
}: {
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) px-4.5 py-4">
      <div className="flex items-baseline gap-3 border-b-2 border-(--color-text) pb-1.5">
        <K className="text-neutral-600">{title}</K>
        <span className="flex-1" />
        {aside}
      </div>
      {children}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { leads } = useLeadContext(),
    { viewingRequests } = useViewingContext(),
    { valuationRequests } = useValuationContext(),
    { listings } = useListingContext(),
    [period, setPeriod] = React.useState<Period>("30d"),
    [cityFilter, setCityFilter] = React.useState("")

  const cities = Array.from(
    new Set(listings.map((l) => l.city).filter((c): c is string => !!c))
  ).sort()

  const listingIdsInCity = cityFilter
      ? new Set(listings.filter((l) => l.city === cityFilter).map((l) => l.id))
      : null,
    scopedListings = cityFilter
      ? listings.filter((l) => l.city === cityFilter)
      : listings,
    scopedLeads = cityFilter
      ? leads.filter(
          (l) =>
            (l.listing_id && listingIdsInCity!.has(l.listing_id)) ||
            l.city === cityFilter
        )
      : leads,
    scopedViewings = cityFilter
      ? viewingRequests.filter((v) => listingIdsInCity!.has(v.listing_id))
      : viewingRequests

  const { start, end, prevStart, prevEnd } = periodRange(period)

  const periodLeads = scopedLeads.filter((l) =>
      inRange(l.created_at, start, end)
    ),
    prevPeriodLeads = scopedLeads.filter((l) =>
      inRange(l.created_at, prevStart, prevEnd)
    ),
    periodViewings = scopedViewings.filter((v) =>
      inRange(v.created_at, start, end)
    ),
    prevPeriodViewings = scopedViewings.filter((v) =>
      inRange(v.created_at, prevStart, prevEnd)
    ),
    periodValuations = valuationRequests.filter((v) =>
      inRange(v.created_at, start, end)
    )

  const heldCount = periodViewings.filter(
      (v) => v.status === "completed"
    ).length,
    prevHeldCount = prevPeriodViewings.filter(
      (v) => v.status === "completed"
    ).length,
    wonCount = periodLeads.filter((l) => l.status === "won").length,
    prevWonCount = prevPeriodLeads.filter((l) => l.status === "won").length,
    replyMedian = median(
      periodLeads.map(firstReplyMinutes).filter((m): m is number => m != null)
    ),
    prevReplyMedian = median(
      prevPeriodLeads
        .map(firstReplyMinutes)
        .filter((m): m is number => m != null)
    )

  const KPIS = [
    {
      label: "Enquiries",
      figure: String(periodLeads.length),
      delta:
        period === "all"
          ? null
          : pctDelta(periodLeads.length, prevPeriodLeads.length),
      note:
        period === "all"
          ? "Since records began"
          : `${prevPeriodLeads.length} the period before`,
    },
    {
      label: "Viewings held",
      figure: String(heldCount),
      delta: period === "all" ? null : pctDelta(heldCount, prevHeldCount),
      note: `${periodViewings.length} booked in the period`,
    },
    {
      label: "Instructions won",
      figure: String(wonCount),
      delta: period === "all" ? null : pctDelta(wonCount, prevWonCount),
      note: `Of ${periodLeads.length} enquiries taken`,
    },
    {
      label: "Median first reply",
      figure: minutesLabel(replyMedian),
      delta:
        period !== "all" && replyMedian != null && prevReplyMedian != null
          ? {
              label: replyMedian <= prevReplyMedian ? "Faster" : "Slower",
              up: replyMedian <= prevReplyMedian,
            }
          : null,
      note:
        period === "all"
          ? "Since records began"
          : prevReplyMedian != null
            ? `${minutesLabel(prevReplyMedian)} the period before`
            : "Not enough data yet",
    },
  ]

  const trend = dailyCounts(scopedLeads, period, start, end),
    sources = sourceBreakdown(periodLeads),
    funnel = funnelStages(periodLeads, scopedViewings),
    valStats = valuationStats(periodValuations),
    timeSlot = mostRequestedTimeSlot(scopedViewings),
    cityRows = byCity(scopedListings, periodLeads, scopedViewings)

  const activeFunnel = funnel.filter((stage) => stage.value > 0)

  const FUNNEL_COLORS = [
    "var(--color-accent)",
    "var(--color-accent-700)",
    "var(--color-accent-2)",
    "var(--color-accent-2-700)",
    "var(--color-neutral-700)",
  ]

  return (
    <PageIn>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7 md:py-4.5">
        <div>
          <h1 className="m-0 text-[24px] font-normal md:text-[26px]">
            Analytics
          </h1>
          <K className="mt-1.5 text-neutral-600">
            {period === "all" ? (
              "Everything on file"
            ) : (
              <>
                {start.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" – "}
                {end.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {` · against ${prevStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${prevEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              </>
            )}
          </K>
        </div>
        <span className="hidden flex-1 md:block" />
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="w-35 flex-none text-[13px]"
        >
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABEL[p]}
            </option>
          ))}
        </Select>
        <Select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="hidden w-37.5 flex-none text-[13px] md:block"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="primary"
          onClick={() => exportLeadsCsv(periodLeads)}
        >
          Export
        </Button>
      </div>

      <Pad className="grid grid-cols-2 gap-3.5 pt-5 md:grid-cols-4">
        {KPIS.map((kpi, index) => (
          <RowIn
            key={kpi.label}
            index={index}
            className="rounded-(--cl-radius-md) border border-(--color-divider) bg-(--color-bg) px-3.75 py-3.25"
          >
            <K className="text-neutral-600">{kpi.label}</K>
            <div className="mt-2.5 flex items-baseline gap-2">
              <div className="cl-fig text-[28px] leading-none md:text-[32px]">
                {kpi.figure}
              </div>
              {kpi.delta ? (
                <div
                  className={`cl-fig cl-k ${kpi.delta.up ? "text-(--color-accent-700)" : "text-(--color-accent-2)"}`}
                >
                  {kpi.delta.label}
                </div>
              ) : null}
            </div>
            <K className="mt-2 text-neutral-600">{kpi.note}</K>
          </RowIn>
        ))}
      </Pad>

      <Pad className="pt-4.5">
        <Card title="Enquiries by day">
          <div className="mt-3.5 h-48">
            {" "}
            {/* Changed to standard h-48 */}
            {trend.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="enquiriesFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-accent)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-divider)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--color-neutral-600)" }}
                    interval="preserveStartEnd"
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={{ color: "var(--color-bg)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Enquiries"
                    stroke="var(--color-accent)"
                    strokeWidth={1.8}
                    fill="url(#enquiriesFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-neutral-600">
                No enquiries in this period yet.
              </div>
            )}
          </div>
        </Card>
      </Pad>

      <Pad className="grid gap-3.5 pt-4.5 md:grid-cols-3">
        <Card title="Where they came from">
          <div className="mt-3 h-48">
            {sources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {/* Increased bottom margin to 20 for the X-axis label */}
                <BarChart
                  data={sources}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 20 }}
                >
                  {/* Un-hid the XAxis, styled ticks, and added an axis label */}
                  <XAxis
                    type="number"
                    stroke="var(--color-divider)"
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-neutral-600)" }}
                    label={{
                      value: "Number of enquiries",
                      position: "insideBottom",
                      offset: -10,
                      fill: "var(--color-neutral-500)",
                      fontSize: 11,
                    }}
                  />
                  <YAxis type="category" dataKey="label" hide />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(
                      value: unknown,
                      _name: unknown,
                      item: { payload?: { pct: number; label: string } }
                    ) => [
                      `${value} enquiries · ${item.payload?.pct}%`,
                      item.payload?.label,
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={36}>
                    {sources.map((s) => (
                      <Cell key={s.source} fill="var(--color-accent)" />
                    ))}
                    <LabelList
                      dataKey="label"
                      position="insideLeft"
                      fill="var(--color-bg)"
                      fontSize={11}
                      offset={10}
                    />
                    <LabelList
                      dataKey="pct"
                      position="right"
                      formatter={(v: unknown) => `${v}%`}
                      fill="var(--color-neutral-600)"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-neutral-600">
                No enquiries in this period yet.
              </div>
            )}
          </div>
        </Card>

        <Card title="What the register did">
          <div className="mt-1 h-48">
            {activeFunnel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart
                  margin={{ top: 20, right: 100, bottom: 20, left: 20 }}
                >
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(
                      value: unknown,
                      _name: unknown,
                      item: { payload?: { label: string } }
                    ) =>
                      [`${value} enquiries`, item.payload?.label ?? ""] as [
                        string,
                        string,
                      ]
                    }
                  />
                  <Funnel
                    dataKey="value"
                    data={activeFunnel}
                    isAnimationActive={false}
                  >
                    {activeFunnel.map((stage, i) => (
                      <Cell
                        key={stage.label}
                        fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="label"
                      position="right"
                      fill="var(--color-neutral-700)"
                      fontSize={11}
                      offset={10}
                    />
                    <LabelList
                      dataKey="value"
                      position="center"
                      fill="var(--color-bg)"
                      fontSize={12}
                      formatter={(value) => `${value ?? 0} enquiries`}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-neutral-600">
                No enquiries in this period yet.
              </div>
            )}
          </div>
        </Card>

        <Card title="Valuations & the diary">
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            {[
              { figure: String(valStats.total), label: "Requests" },
              { figure: String(valStats.completed), label: "Reports issued" },
              {
                figure: daysLabel(valStats.daysToReport),
                label: "Days to report",
              },
              {
                figure:
                  valStats.total > 0
                    ? `${valStats.converted} of ${valStats.total}`
                    : "—",
                label: "Converted to a listing",
              },
            ].map((v) => (
              <div
                key={v.label}
                className="rounded-(--cl-radius-md) border border-(--color-divider) bg-neutral-100 px-3.5 py-2.5"
              >
                <div className="cl-fig text-[22px] leading-none">
                  {v.figure}
                </div>
                <K className="mt-1.5">{v.label}</K>
              </div>
            ))}
          </div>
          <div className="cl-pair mt-3.5">
            <span className="text-neutral-700">Most requested time</span>
            <span className="cl-fig capitalize">{timeSlot}</span>
          </div>
        </Card>
      </Pad>

      <Pad className="pt-4.5 pb-7 md:pb-6.5">
        <div className="rounded-(--cl-radius-lg) border border-(--color-divider) bg-(--color-bg) px-4.5 py-4">
          <div className="flex items-baseline gap-3 border-b border-(--color-divider) pb-2">
            <K className="text-neutral-600">By city</K>
            <span className="flex-1" />
            <K className="text-neutral-500">Sorted by enquiries</K>
          </div>

          {cityRows.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-neutral-600">
              No listings have a city on file yet.
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="grid grid-cols-[minmax(0,1fr)_74px_74px_74px_96px] gap-3 border-b border-(--color-divider) py-2.5">
                  <K className="text-neutral-600">City & listings</K>
                  <K className="text-right text-neutral-600">Enquiries</K>
                  <K className="text-right text-neutral-600">Viewings</K>
                  <K className="text-right text-neutral-600">Won</K>
                  <K className="text-right text-neutral-600">First reply</K>
                </div>
                {cityRows.map((row, index) => (
                  <RowIn
                    key={row.city}
                    index={index}
                    className="grid grid-cols-[minmax(0,1fr)_74px_74px_74px_96px] items-center gap-3 border-b border-(--color-divider) py-2.5 text-[13px] last:border-b-0"
                  >
                    <div>
                      {row.city}
                      <K className="mt-1">
                        {row.listings} listing{row.listings === 1 ? "" : "s"}
                      </K>
                    </div>
                    <div className="cl-fig text-right">{row.enquiries}</div>
                    <div className="cl-fig text-right">
                      {row.viewings > 0 ? `${row.held}/${row.viewings}` : "—"}
                    </div>
                    <div className="cl-fig text-right">{row.won}</div>
                    <div className="cl-fig text-right">
                      {minutesLabel(row.replyMedianMinutes)}
                    </div>
                  </RowIn>
                ))}
              </div>
              <div className="md:hidden">
                {cityRows.map((row, index) => (
                  <RowIn
                    key={row.city}
                    index={index}
                    className="grid grid-cols-[minmax(0,1fr)_56px_74px] gap-2.5 border-b border-(--color-divider) py-2.5 text-[13px] last:border-b-0"
                  >
                    <div>
                      {row.city}
                      <K className="mt-1">
                        {row.listings} listing{row.listings === 1 ? "" : "s"}
                      </K>
                    </div>
                    <div className="cl-fig text-right">{row.enquiries}</div>
                    <div className="cl-fig text-right">
                      {minutesLabel(row.replyMedianMinutes)}
                    </div>
                  </RowIn>
                ))}
              </div>
            </>
          )}
        </div>
      </Pad>
    </PageIn>
  )
}
