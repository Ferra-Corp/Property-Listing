"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ButtonLink } from "../../_components/ui/button"

export default function UnsubscribePage() {
  return (
    <React.Suspense fallback={null}>
      <UnsubscribeNotice />
    </React.Suspense>
  )
}

function UnsubscribeNotice() {
  const searchParams = useSearchParams(),
    id = searchParams.get("id"),
    [status, setStatus] = React.useState<"pending" | "done" | "error">(
      id ? "pending" : "error"
    )

  React.useEffect(() => {
    if (!id) return

    let cancelled = false

    ;(async () => {
      try {
        const request = await fetch(
          `/system/api/v1/subscribers?id=${encodeURIComponent(id)}`
        )
        if (!cancelled) setStatus(request.ok ? "done" : "error")
      } catch {
        if (!cancelled) setStatus("error")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="flex min-h-[64dvh] flex-col items-center justify-center px-3 py-16 text-center md:px-6 md:py-24">
      <div className="cl-k text-neutral-600)">Listing alerts</div>
      <h1 className="mt-3 mb-0 max-w-[20ch] text-[32px] leading-[1.12] font-normal md:mt-4 md:text-[48px] md:leading-[1.08]">
        {status === "error" ? "Couldn't unsubscribe" : "You're unsubscribed"}
      </h1>
      <p className="text-neutral-700) mt-3 mb-0 max-w-[52ch] text-[14px] leading-[1.7] md:mt-4 md:text-[16px]">
        {status === "pending"
          ? "One moment…"
          : status === "done"
            ? "No further listing alerts will be sent to this address. You can sign up again any time from the homepage."
            : "That link looks broken or has already been used. Contact us if you'd like a hand."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-7">
        <ButtonLink href="/" variant="primary">
          Back to the homepage
        </ButtonLink>
        {status === "error" ? (
          <ButtonLink href="/system/contact" variant="secondary">
            Contact us
          </ButtonLink>
        ) : null}
      </div>
    </div>
  )
}
