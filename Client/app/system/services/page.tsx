"use client"

import { ButtonLink } from "../../_components/ui/button"
import { Plate } from "../../_components/ui/plate"
import { useServiceContext } from "../../_lib/Context/Service"

const PROCESS = [
  [
    "A call, then a visit",
    "We agree what you want to achieve and see the property. No charge, no obligation.",
  ],
  [
    "A figure and a written proposal",
    "The rate or price we would ask, the evidence behind it, the fee and the term of the mandate.",
  ],
  [
    "You instruct, we photograph",
    "Measured survey and twelve plates or more, at our cost, before anything is published.",
  ],
  [
    "Marketing and viewings",
    "Listed here, sent to our list, and shown by the agent who holds it — never by a caretaker.",
  ],
  [
    "Terms, then completion",
    "Heads of terms to your advocate, and we chase it to occupation or transfer.",
  ],
] as const

const EXCLUSIONS = [
  ["Charge a tenant or buyer a fee", "Never", true],
  ["Take a listing we have not inspected", "Never", true],
  ["Collect rent or manage buildings", "Not our trade", false],
  ["Act for both sides on one deal", "Never", true],
  ["Sell mortgages or insurance", "Ask your bank", false],
] as const

export default function ServicesPage() {
  const { services: allServices } = useServiceContext(),
    services = [...allServices].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <div className="mt-4 px-3 pt-3 md:px-6 md:pt-1.25">
        <Plate
          className="aspect-video border-0 md:aspect-auto md:h-60 md:border-4"
          label="Plate 01 — A shed being measured, Ruiru · 1900x600"
        />
      </div>

      {/* ── The premise ── */}
      <section className="px-4 pt-5 md:px-10 md:pt-8.5">
        <div className="cl-k text-neutral-600)">
          Services · what we are instructed to do
        </div>
        <h1 className="mt-2.5 mb-0 max-w-[24ch] text-[29px] leading-[1.12] font-normal md:mt-4 md:text-[44px] md:leading-[1.08]">
          What we take instructions for
        </h1>
        <p className="mt-3 mb-0 max-w-[70ch] text-justify text-[14px] leading-[1.7] [hyphens:auto] md:mt-4 md:text-[15.5px] md:leading-[1.75]">
          Tenants and buyers pay us nothing; our fee comes from the owner, and
          it is agreed in writing before any work starts. Get in touch for a
          quote against your specific instruction.
        </p>
      </section>

      {/* ── The instructions ── */}
      {services.length > 0 ? (
        <section className="px-4 pt-7 md:px-10 md:pt-7.5">
          <div className="cl-snum">
            <span>Our services</span>
          </div>

          {services.map((service, index) => (
            <div
              key={service.id}
              className={
                "grid items-start gap-3 border-b border-(--color-divider) py-5 md:grid-cols-[1fr_220px] md:gap-6.5 md:py-6.5" +
                (index === services.length - 1 ? " border-b-0" : "")
              }
            >
              <div>
                <h3 className="mb-0 text-[22px] font-normal md:text-[27px]">
                  {service.title}
                </h3>
                {service.summary ? (
                  <p className="text-neutral-700) mt-2.5 mb-0 max-w-[58ch] text-[13.5px] leading-[1.7] md:text-[14px]">
                    {service.summary}
                  </p>
                ) : null}
                {service.description ? (
                  <p className="text-neutral-700) mt-2 mb-0 max-w-[58ch] text-[13px] leading-[1.65]">
                    {service.description}
                  </p>
                ) : null}
              </div>

              <ButtonLink
                href="/system/contact"
                variant="secondary"
                className="flex-none md:w-full"
              >
                Ask about this
              </ButtonLink>
            </div>
          ))}
        </section>
      ) : null}

      {/* ── Process, exclusions, fees ── */}
      <section className="grid gap-7 px-4 pt-7 md:grid-cols-2 md:gap-12 md:px-10 md:pt-8.5">
        <div>
          <div className="cl-snum">
            <span>How an instruction runs</span>
          </div>
          <div className="mt-3.5 flex flex-col gap-3 md:mt-4 md:gap-4">
            {PROCESS.map(([title, body], index) => (
              <div key={title} className="flex gap-2.5 md:gap-3.5">
                <span className="cl-fig cl-mono pt-0.5 text-[11px] text-(--color-accent)">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-[14px] md:text-[14.5px]">{title}</div>
                  <div className="text-neutral-700) mt-1 text-[13px] leading-[1.65]">
                    {body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="cl-snum">
            <span>What we do not do</span>
          </div>
          {EXCLUSIONS.map(([label, answer, lava], index) => (
            <div
              key={label}
              className={
                "cl-pair text-[13px] md:text-[13.5px]" +
                (index === 0 ? " pt-3.5" : "") +
                (index === EXCLUSIONS.length - 1 ? " border-b-0" : "")
              }
            >
              <span className="text-neutral-700)">{label}</span>
              <span
                className={
                  "cl-fig cl-k " +
                  (lava ? "text-(--color-accent-2)" : "text-neutral-600")
                }
              >
                {answer}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Instruct us ── */}
      <section className="mx-4 mt-7 grid items-center gap-4 rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-200 p-4 md:mx-10 md:mt-8.5 md:grid-cols-[1fr_300px] md:gap-9 md:p-6">
        <div>
          <h3 className="mb-0 text-[21px] font-normal md:text-[27px]">
            Instruct us, or just ask
          </h3>
          <p className="text-neutral-700) mt-2.5 mb-0 max-w-[58ch] text-[13px] leading-[1.7] md:text-[14px]">
            A first conversation costs nothing and usually settles whether we
            are the right people for the job. If we are not — if you need
            management, or a formal court valuation — we will say so and point
            you to someone who is.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <ButtonLink href="/system/valuation-requests" variant="primary" block>
            Sell or value my property
          </ButtonLink>
          <ButtonLink href="/system/contact" variant="secondary" block>
            Send a requirement
          </ButtonLink>
        </div>
      </section>

      <div className="h-6" />
    </>
  )
}
