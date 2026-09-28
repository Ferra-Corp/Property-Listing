"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Printer, Share2 } from "lucide-react"
import { ButtonLink } from "../../../_components/ui/button"
import { Card, CardKicker, CardTitle } from "../../../_components/ui/card"
import { Input } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { useInsightContext } from "../../../_lib/Context/Insight"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useListingContext } from "../../../_lib/Context/Listing"
import { relativeDate } from "../../../_lib/format"
import {
  toRowListing,
  useCurrencyConversion,
} from "../../listings/_components/listing-row"

export default function InsightDetailPage() {
  const { slug } = useParams<{ slug: string }>(),
    { insights } = useInsightContext(),
    { agents } = useAgentContext(),
    { listings } = useListingContext(),
    convertTo = useCurrencyConversion(),
    insight = insights.find((item) => item.slug === slug)

  if (insights.length === 0)
    return (
      <div className="px-4 pt-8 md:px-10">
        <div className="cl-skeleton h-5 w-1/4 rounded-full" />
        <div className="cl-skeleton mt-4 h-10 w-3/4 rounded-md" />
        <div className="cl-skeleton mt-3 h-4 w-1/3 rounded-full" />
        <div className="cl-skeleton mt-6 aspect-16/10 w-full rounded-xl md:h-100" />
        <div className="mt-6 grid gap-2">
          <div className="cl-skeleton h-4 w-full rounded-full" />
          <div className="cl-skeleton h-4 w-11/12 rounded-full" />
          <div className="cl-skeleton h-4 w-10/12 rounded-full" />
        </div>
      </div>
    )

  if (!insight)
    return (
      <div className="px-4 py-16 text-center md:px-10">
        <h1 className="mb-2 text-[24px] font-normal">Note not found</h1>
        <Link href="/system/insights" className="text-[13.5px]">
          ← Back to insights
        </Link>
      </div>
    )

  const author = agents.find((agent) => agent.user_id === insight.author_id),
    dateline = [
      insight.target_city,
      relativeDate(insight.published_at ?? insight.created_at),
    ]
      .filter(Boolean)
      .join(" · "),
    related = insights
      .filter(
        (item) =>
          item.id !== insight.id &&
          item.status === "published" &&
          item.tags.some((tag) =>
            insight.tags.some((ownTag) => ownTag.id === tag.id)
          )
      )
      .slice(0, 3),
    relevantListings = insight.target_state_region
      ? listings
          .filter((l) => l.state_region === insight.target_state_region)
          .slice(0, 3)
          .map((item) => toRowListing(item, convertTo))
      : []

  return (
    <>
      {/* ── Dateline and byline ── */}
      <section className="px-4 pt-5 md:px-10 md:pt-6.5">
        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/system/insights" className="text-[12.5px]">
            Insights
          </Link>
          {insight.tags[0] ? (
            <>
              <span className="cl-k text-neutral-500">/</span>
              <span className="cl-k text-neutral-600">
                {insight.tags[0].name}
              </span>
            </>
          ) : null}
        </div>

        {dateline ? (
          <div className="cl-k text-(--color-accent) md:mt-4">{dateline}</div>
        ) : null}
        <h1 className="mt-3 mb-0 max-w-[26ch] text-[31px] leading-[1.1] font-normal md:mt-3.5 md:text-[50px] md:leading-[1.06]">
          {insight.title}
        </h1>
        {insight.summary ? (
          <p className="mt-3 mb-0 max-w-[66ch] text-[15px] leading-[1.6] text-neutral-700 md:mt-3.5 md:text-[19px]">
            {insight.summary}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-3 border-y border-(--color-divider) py-3 md:mt-5 md:gap-4 md:py-3.5">
          <div className="flex-1">
            {author ? (
              <div className="text-[13.5px] md:text-[14px]">
                {author.display_name}
              </div>
            ) : null}
            <div className="cl-k mt-1 text-neutral-600">
              {author?.title ?? "Editorial team"}
            </div>
          </div>
          <div className="cl-fig cl-k text-neutral-600">
            {insight.read_minutes} min read
          </div>
          <div className="hidden gap-1.75 md:flex">
            <ButtonLink
              href="#"
              variant="secondary"
              size="icon"
              className="size-8"
              title="Share"
            >
              <Share2 size={14} />
            </ButtonLink>
            <ButtonLink
              href="#"
              variant="secondary"
              size="icon"
              className="size-8"
              title="Print"
            >
              <Printer size={14} />
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="px-3 pt-4 md:px-6 md:pt-5">
        <Plate
          className="aspect-16/10 border-0 md:aspect-auto md:h-100 md:border-4"
          src={insight.cover_image_url}
          alt={insight.cover_image_alt ?? insight.title}
          label={insight.cover_image_alt ?? insight.title}
        />
      </div>

      <div className="grid items-start gap-8 px-4 pt-5 md:grid-cols-[1fr_300px] md:gap-14 md:px-10 md:pt-8.5">
        {/* ── The article ── */}
        <article
          className="cl-body"
          dangerouslySetInnerHTML={{ __html: insight.content }}
        />

        {/* ── Rail ── */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20">
          {author ? (
            <div className="cl-card gap-0 p-4 md:p-5">
              <div className="cl-k text-neutral-600">Written by</div>
              <div className="mt-3 flex items-start gap-3">
                <Plate
                  matted={false}
                  className="h-16 w-13 flex-none md:h-17.5 md:w-14"
                  label={author.photo_url ?? author.display_name}
                />
                <div>
                  <div className="font-(family-name:--font-heading) text-[19px] md:text-[20px]">
                    {author.display_name}
                  </div>
                  {author.title ? (
                    <div className="cl-k mt-1 text-neutral-600">
                      {author.title}
                    </div>
                  ) : null}
                </div>
              </div>
              {author.bio ? (
                <p className="mt-2.5 mb-0 text-[12.5px] leading-[1.65] text-neutral-700 md:mt-3">
                  {author.bio}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2 md:flex-col">
                <ButtonLink
                  href="/system/contact"
                  variant="primary"
                  className="flex-1"
                  block
                >
                  Ask {author.display_name.split(" ")[0]} about this
                </ButtonLink>
                <ButtonLink
                  href={`/system/agents/${author.slug}`}
                  variant="secondary"
                  className="flex-1"
                  block
                >
                  Their profile
                </ButtonLink>
              </div>
            </div>
          ) : null}

          <div className="rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-100 p-4 md:p-4.5">
            <div className="cl-k text-neutral-600">The note, by email</div>
            <h4 className="mt-2 mb-0 text-[19px] font-normal md:text-[20px]">
              Rate movements as they happen
            </h4>
            <p className="mt-2 mb-3 hidden text-[12.5px] leading-[1.65] text-neutral-700 md:block">
              One note a fortnight on the market. Unsubscribe in one click.
            </p>
            <div className="mt-3 flex flex-col gap-2 md:mt-0">
              <Input placeholder="Email address" type="email" />
              <ButtonLink href="/system/contact" variant="primary" block>
                Send it to me
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Relevant listings ── */}
      {relevantListings.length > 0 ? (
        <section className="px-4 pt-8 md:px-10 md:pt-9">
          <div className="cl-snum">
            <span>Listings in {insight.target_state_region}</span>
            <Link href="/system/listings" className="cl-k">
              All listings →
            </Link>
          </div>
          <div className="mt-3.5 grid gap-3 md:mt-5 md:grid-cols-3 md:gap-5">
            {relevantListings.map((listing) => (
              <Link
                key={listing.slug}
                href={`/system/listings/${listing.slug}`}
                className="contents"
              >
                <Card className="overflow-hidden rounded-lg p-0 text-(--color-text) transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                  <Plate
                    matted={false}
                    className="aspect-16/10"
                    label={listing.plate}
                    src={listing.plateImage}
                    alt={listing.title}
                  />
                  <div className="px-4 pt-3.5 pb-4">
                    <CardKicker>{listing.where}</CardKicker>
                    <CardTitle className="mt-1.75">{listing.title}</CardTitle>
                    <div className="cl-fig mt-1.75 text-[13px] text-neutral-700">
                      {listing.price} {listing.priceUnit}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Related notes ── */}
      {related.length > 0 ? (
        <section className="px-4 pt-8 pb-6 md:px-10 md:pt-9">
          <div className="cl-snum">
            <span>Related notes</span>
            <Link href="/system/insights" className="cl-k">
              All insights →
            </Link>
          </div>
          <div className="mt-3.5 grid md:mt-4.5 md:grid-cols-3 md:gap-x-8.5">
            {related.map((note, index) => (
              <article
                key={note.slug}
                className={
                  "border-b border-(--color-divider) py-3.5 md:border-b-0 md:py-0 " +
                  (index < related.length - 1
                    ? "md:border-r md:border-(--color-divider) md:pr-8.5"
                    : "")
                }
              >
                {note.tags[0] ? (
                  <div className="cl-k text-(--color-accent)">
                    {note.tags[0].name}
                  </div>
                ) : null}
                <h4 className="mt-2 mb-0 text-[18px] leading-[1.3] font-normal md:text-[19px]">
                  <Link
                    href={`/system/insights/${note.slug}`}
                    className="text-(--color-text)"
                  >
                    {note.title}
                  </Link>
                </h4>
                {note.summary ? (
                  <p className="mt-2 mb-0 hidden text-[13px] leading-[1.65] text-neutral-700 md:block">
                    {note.summary}
                  </p>
                ) : null}
                <div className="cl-k cl-fig mt-2.5 text-neutral-600">
                  {note.read_minutes} min read
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
