"use client"

import * as React from "react"
import { cn } from "cn"

export type MarqueeLogo = { src: string; name: string }

const SECONDS_PER_LOGO = 3.5

/**
 * A row of company logos. If they all fit the width, it's a plain left-aligned
 * row — nothing moves and nothing repeats. Only when they overflow does it
 * become a right-to-left loop (see .cl-marquee in classical.css), so the ones
 * beyond the screen scroll into view. That overflow is measured, not guessed,
 * and re-measured as the window resizes or the logos load.
 *
 * When looping, the set is rendered twice and the track slides by exactly
 * half. One set is already wider than the viewport (that's what "overflow"
 * means), so the seam never shows a gap. The second copy is aria-hidden.
 * Logos are shown as they are: PNGs with their own colour and transparency,
 * with no tile or tint behind them.
 */
export function LogoMarquee({
  logos,
  className,
}: {
  logos: MarqueeLogo[]
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null),
    setRef = React.useRef<HTMLUListElement>(null),
    [scrolling, setScrolling] = React.useState(false)

  React.useEffect(() => {
    const container = containerRef.current,
      set = setRef.current
    if (!container || !set) return

    const measure = () =>
      setScrolling(set.scrollWidth > container.clientWidth + 1)

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(set)
    // Logos have no intrinsic size until they load, which changes the width.
    set.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true })
    })

    return () => observer.disconnect()
  }, [logos])

  if (logos.length === 0) return null

  const renderSet = (clone: boolean) => (
    <ul
      ref={clone ? undefined : setRef}
      aria-hidden={clone || undefined}
      {...(clone ? { "data-marquee-clone": true } : {})}
      className="m-0 flex w-max list-none items-center p-0"
    >
      {logos.map((logo) => (
        <li
          key={logo.src}
          className="flex h-12 flex-none items-center px-4 md:h-14 md:px-7"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={clone ? "" : logo.name}
            loading="lazy"
            draggable={false}
            className="max-h-full w-auto max-w-40 object-contain md:max-w-48"
          />
        </li>
      ))}
    </ul>
  )

  return (
    <div
      ref={containerRef}
      data-scrolling={scrolling || undefined}
      className={cn("cl-marquee", className)}
    >
      <div
        className={cn(
          "flex w-max min-w-full",
          scrolling && "cl-marquee-track"
        )}
        style={
          scrolling
            ? ({
                "--cl-marquee-duration": `${Math.max(20, logos.length * SECONDS_PER_LOGO)}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {renderSet(false)}
        {scrolling ? renderSet(true) : null}
      </div>
    </div>
  )
}
