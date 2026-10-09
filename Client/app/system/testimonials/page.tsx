"use client"

import { ButtonLink } from "../../_components/ui/button"
import { Avatar, Stars } from "../../_components/ui/testimonial"
import { useTestimonialContext } from "../../_lib/Context/Testimonial"

export default function TestimonialsPage() {
  const { testimonials, loading } = useTestimonialContext()

  const average =
    testimonials.length > 0
      ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
      : 0

  return (
    // The header, footer and main wrapper above this aren't a flex column, so
    // the height is approximated: enough that on a short page the call to
    // action (mt-auto) is pushed down against the footer instead of floating.
    <div className="flex min-h-[calc(100dvh-22rem)] flex-col">
      <section className="px-4 pt-5 md:px-10 md:pt-8.5">
        <div className="cl-k text-neutral-600)">
          Testimonials · in our clients&apos; words
        </div>
        <h1 className="mt-2.5 mb-0 max-w-[24ch] text-[29px] leading-[1.12] font-normal md:mt-4 md:text-[44px] md:leading-[1.08]">
          What our clients say
        </h1>
        {testimonials.length > 0 ? (
          <div className="mt-3 flex items-center gap-2.5 md:mt-4">
            <Stars rating={Math.round(average)} className="text-[16px]" />
            <span className="cl-k cl-fig text-neutral-600">
              {average.toFixed(1)} average from {testimonials.length} review
              {testimonials.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}
      </section>

      <section className="px-4 pt-7 pb-8 md:px-10 md:pt-7.5 md:pb-10">
        {testimonials.length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-neutral-600">
            {loading ? "Loading…" : "No testimonials to show yet."}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 md:gap-x-12 md:gap-y-9">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="m-0 flex flex-col border-t-2 border-(--color-accent) pt-3"
              >
                <Stars rating={t.rating} className="text-[14px]" />
                <blockquote className="text-neutral-700) mt-2.5 mb-0 flex-1 text-[14px] leading-[1.75]">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-3.5 flex items-center gap-3">
                  <Avatar name={t.name} src={t.profile_picture} />
                  <div>
                    <div className="text-[14px]">{t.name}</div>
                    <div className="cl-k text-neutral-600) mt-0.5">
                      {[
                        t.company_name,
                        new Date(t.created_at).toLocaleDateString("en-GB", {
                          month: "short",
                          year: "numeric",
                        }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="mx-4 mt-auto flex flex-col gap-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-200 p-4 md:mx-10 md:flex-row md:items-center md:justify-between md:p-6">
        <h3 className="mb-0 text-[21px] font-normal md:text-[24px]">
          Want to be our next success story?
        </h3>
        <div className="flex gap-2">
          <ButtonLink href="/system/valuation-requests" variant="primary">
            Sell or value my property
          </ButtonLink>
          <ButtonLink href="/system/contact" variant="secondary">
            Get in touch
          </ButtonLink>
        </div>
      </section>

      <div className="h-6" />
    </div>
  )
}
