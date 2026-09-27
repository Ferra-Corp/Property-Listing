"use client"

import * as React from "react"

/**
 * iOS 18+ Safari has no Vibration API but does trigger a system haptic
 * when a <label> for a `<input type="checkbox" switch>` is activated
 * inside a user gesture.
 *
 * We render one hidden switch + label at the app root and register a
 * click function on window so the SSR-safe `haptic()` utility can call
 * it without pulling in React on every button.
 */
export function HapticsProvider({ children }: { children: React.ReactNode }) {
  const labelRef = React.useRef<HTMLLabelElement>(null)

  React.useEffect(() => {
    const trigger = () => {
      const el = labelRef.current
      if (el) el.click()
    }
    window.__dgHaptic = trigger
    return () => {
      if (window.__dgHaptic === trigger) delete window.__dgHaptic
    }
  }, [])

  return (
    <>
      {/* Off-screen, non-focusable, non-interactive to the user. The
          `switch` attribute is the iOS 18 hint that the system uses to
          decide whether to fire a haptic. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        <label ref={labelRef} htmlFor="dg-haptic-switch">
          Haptic trigger
          {/* @ts-expect-error — `switch` is an iOS-only Safari 18 attribute
              on <input type="checkbox">; TypeScript's DOM lib doesn't know
              about it yet. Adding it changes iOS behaviour; other browsers
              ignore it. */}
          <input id="dg-haptic-switch" type="checkbox" switch="" tabIndex={-1} />
        </label>
      </span>
      {children}
    </>
  )
}
