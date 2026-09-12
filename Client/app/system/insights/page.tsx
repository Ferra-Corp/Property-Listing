"use client"

import Link from "next/link"
import { Card } from "../../_components/ui/card"
import { ButtonLink } from "../../_components/ui/button"
import { Input, Select } from "../../_components/ui/field"
import { Plate } from "../../_components/ui/plate"
import { IndexRow } from "../../_components/ui/section"
import { useInsightContext } from "../../_lib/Context/Insight"
import { useAgentContext } from "../../_lib/Context/Agent"
import { relativeDate } from "../../_lib/format"

export default function InsightsIndexPage() {
  const { insights: allInsights } = useInsightContext(),
    { agents } = useAgentContext(),
    insights = allInsights
      .filter((insight) => insight.status === "published")
      .sort(
        (a, b) =>
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
      ),
    authorName = (authorId: string | null) =>
      agents.find((agent) => agent.user_id === authorId)?.display_name ?? null,
    places = Array.from(
      new Set(insights.map((insight) => insight.target_city).filter(Boolean))
    ) as string[],
    subjects = Array.from(
      new Set(insights.flatMap((insight) => insight.tags.map((t) => t.name)))
    ),
    [lead, ...rest] = insights,
    featured = rest.slice(0, 2),
    earlier = rest.slice(2)

  return (
    <>
      {/* ── Masthead ──
          Horizontal inset (px-3 / md:px-6) mirrors the site header's own
          mx-3 / md:mx-6 margin, so the hairline rule below and every full-width
          element on this page lines up with the header's outer edge instead
          of running wider than the floating header bar. */}
      <section className="px-3 pt-5 md:px-6 md:pt-6.5">
        <div className="cl-k text-neutral-600">
          Insights · market notes and area guides
        </div>
        <div className="mt-2.5 flex flex-col gap-2 border-b-2 border-(--color-text) pb-3 md:mt-3 md:flex-row md:items-end md:justify-between md:gap-7.5 md:pb-3.5">
          <h1 className="m-0 max-w-[26ch] text-[28px] leading-[1.12] font-normal md:text-[42px] md:leading-[1.08]">
            What the market did, written by the people who let the space
          </h1>
          <div className="cl-fig cl-mono flex-none text-[11.5px] text-neutral-600 md:text-right md:text-[12px]">
            {insights.length} note{insights.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      {/* ── The lead note ── */}
      {lead ? (
        <section className="grid gap-0 px-3 pt-3.5 md:grid-cols-[1.5fr_1fr] md:gap-1.25 md:px-6 md:pt-5.5">
          <Plate
            className="aspect-16/10 rounded-lg border-0 md:aspect-auto md:h-82.5 md:border-4"
            label={lead.cover_image_alt ?? lead.title}
          />
          <div className="px-4 pt-4 md:pt-1.5 md:pr-8.5 md:pl-7.5">
            <div className="cl-k text-(--color-accent)">
              {[
                lead.target_city,
                relativeDate(lead.published_at ?? lead.created_at),
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
            <h2 className="mt-2.5 mb-0 text-[25px] leading-[1.2] font-normal md:mt-3 md:text-[33px] md:leading-[1.15]">
              {lead.title}
            </h2>
            {lead.summary ? (
              <p className="mt-2 mb-0 text-[13.5px] leading-[1.7] text-neutral-700 md:mt-3 md:text-[14.5px]">
                {lead.summary}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2.5 md:mt-4 md:gap-3">
              <div>
                <div className="cl-fig cl-k text-neutral-600 md:mt-1">
                  {authorName(lead.author_id)
                    ? `${authorName(lead.author_id)} · `
                    : ""}
                  {lead.read_minutes} min read
                </div>
              </div>
            </div>
            <ButtonLink
              href={`/system/insights/${lead.slug}`}
              variant="primary"
              className="mt-3.5 w-full justify-center md:mt-4.5 md:w-auto"
            >
              Read the note
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {/* ── Place / subject filters — decorative until search is wired ── */}
      {places.length > 0 || subjects.length > 0 ? (
        <section className="px-3 pt-5 md:px-6 md:pt-7.5">
          {places.length > 0 ? (
            <div className="-mx-3 flex scrollbar-none items-center gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <span className="cl-k mr-1 hidden text-neutral-600 md:inline">
                By place
              </span>
              {places.map((place) => (
                <Link key={place} href="/system/insights" className="cl-chip">
                  {place}
                </Link>
              ))}
            </div>
          ) : null}
          {subjects.length > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-4 md:mt-3">
              <div className="-mx-3 flex scrollbar-none items-center gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                <span className="cl-k mr-1 hidden text-neutral-600 md:inline">
                  By subject
                </span>
                {subjects.map((subject) => (
                  <Link
                    key={subject}
                    href="/system/insights"
                    className="cl-chip"
                  >
                    {subject}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid items-start gap-8 px-3 pt-5 md:grid-cols-[1fr_300px] md:gap-12 md:px-6 md:pt-6.5">
        <div>
          {/* ── Featured notes ── */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-6.5">
            {featured.map((note) => (
              <Card
                key={note.slug}
                className="overflow-hidden rounded-lg p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-sm)"
              >
                <Plate
                  matted={false}
                  className="aspect-video"
                  label={note.cover_image_alt ?? note.title}
                />
                <div className="px-4 pt-4 pb-4 md:px-4.5 md:pb-4.5">
                  <div className="cl-k text-(--color-accent)">
                    {[
                      note.target_city,
                      relativeDate(note.published_at ?? note.created_at),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <h3 className="mt-2 mb-0 text-[20px] leading-tight font-normal md:text-[22px]">
                    <Link
                      href={`/system/insights/${note.slug}`}
                      className="text-(--color-text)"
                    >
                      {note.title}
                    </Link>
                  </h3>
                  {note.summary ? (
                    <p className="mt-2 mb-0 text-[13px] leading-[1.65] text-neutral-700">
                      {note.summary}
                    </p>
                  ) : null}
                  <div className="cl-fig cl-k mt-3 text-neutral-600">
                    {authorName(note.author_id)
                      ? `${authorName(note.author_id)} · `
                      : ""}
                    {note.read_minutes} min read
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* ── Earlier notes, as a dated register ── */}
          {earlier.length > 0 ? (
            <div className="mt-7 md:mt-7.5">
              <div className="cl-k text-neutral-600) border-b-2 border-(--color-text) pb-2">
                Earlier notes
              </div>
              {earlier.map((note, index) => (
                <Link
                  key={note.slug}
                  href={`/system/insights/${note.slug}`}
                  className={
                    "cl-midx items-start py-3.5 md:py-4" +
                    (index === earlier.length - 1 ? " border-b-0" : "")
                  }
                >
                  <div className="max-w-[62ch]">
                    <div className="cl-k text-(--color-accent)">
                      {[
                        note.target_city,
                        relativeDate(note.published_at ?? note.created_at),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="mt-1.5 font-(family-name:--font-heading) text-[17px] md:mt-1.75 md:text-[19px]">
                      {note.title}
                    </div>
                    {note.summary ? (
                      <p className="mt-1.5 mb-0 hidden text-[12.5px] leading-[1.6] text-neutral-700 md:block">
                        {note.summary}
                      </p>
                    ) : null}
                  </div>
                  <span className="cl-fig cl-k flex-none text-neutral-600">
                    {note.read_minutes} min
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Rail ── */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20">
          {places.length > 0 ? (
            <div className="cl-card hidden gap-0 p-5 md:flex">
              <div className="cl-k text-neutral-600">Notes by place</div>
              {places.map((place, index) => (
                <IndexRow
                  key={place}
                  href="/system/insights"
                  label={place}
                  figure={
                    insights.filter((i) => i.target_city === place).length
                  }
                  className={
                    "py-2.5 text-[13.5px]" +
                    (index === places.length - 1 ? " border-b-0" : "")
                  }
                />
              ))}
            </div>
          ) : null}

          {/* Translucent, backdrop-blurred surface — the same glass
              treatment as the header — so the rail's one interactive card
              reads as part of the same modern chrome as the nav above. */}
          <div className="rounded-(--cl-radius-lg) border border-(--color-divider) bg-[color-mix(in_srgb,var(--color-neutral-100)_88%,transparent)] p-4 backdrop-blur-sm md:p-4.5">
            <div className="cl-k text-neutral-600">One note a fortnight</div>
            <h4 className="mt-2 mb-0 text-[19px] font-normal md:text-[20px]">
              Rates and new mandates, by email
            </h4>
            <p className="mt-2 mb-3 hidden text-[12.5px] leading-[1.6] text-neutral-700 md:block">
              Choose a segment and we send the note when it is written — nothing
              else.
            </p>
            <div className="mt-3 flex flex-col gap-2 md:mt-0">
              <Select className="text-[13px]" defaultValue="">
                <option value="">Which segment?</option>
                <option>Industrial &amp; warehousing</option>
                <option>Offices</option>
                <option>Retail</option>
                <option>Residential</option>
              </Select>
              <Input
                placeholder="Email address"
                type="email"
                className="text-[13px]"
              />
              <ButtonLink href="/system/contact" variant="primary" block>
                Subscribe
              </ButtonLink>
            </div>
          </div>

          {/* Classical pull-quote spine, softened with a faint tint and a
              rounded outer corner so it reads as a quiet card rather than a
              bare rule. */}
          <div className="hidden rounded-r-lg border-l-2 border-(--color-accent) bg-[color-mix(in_srgb,var(--color-accent)_5%,transparent)] py-2.5 pr-3.5 pl-3.5 md:block">
            <p className="m-0 text-[12.5px] leading-[1.65] text-neutral-700">
              Every note names the listings it refers to, so you can read the
              argument and then look at the buildings.
            </p>
            <Link
              href="/system/listings"
              className="mt-1.5 inline-block text-[12.5px] underline-offset-4 transition-colors hover:underline"
            >
              Browse current listings →
            </Link>
          </div>

          <Plate
            matted={false}
            className="hidden aspect-4/5 rounded-lg md:grid"
            label={
              <>
                Plate — the industrial belt at dusk
                <br />
                1000×1250
              </>
            }
          />
        </aside>
      </div>

      <div className="h-8" />
    </>
  )
}
