"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"

/**
 * Wraps route content so navigating between pages crossfades instead of
 * hard-cutting. Keyed on the pathname only (not search params) — filtering
 * or paginating in place (e.g. `?purpose=`, `?page=`) must not retrigger
 * this, only an actual change of page should.
 *
 * `mode="wait"` lets the outgoing page fully exit before the incoming one
 * enters, rather than the two overlapping in the same flow position (which
 * would otherwise cause a layout jump).
 *
 * Framer Motion doesn't touch the DOM at all until `mounted` flips true —
 * on the server, and for the first paint after hydration, this renders
 * `children` completely plain, identical to the SSR'd HTML. Only after
 * mount does it hand control to AnimatePresence/motion.div. `initial={false}`
 * on top of that means even that first animated render skips the enter
 * animation — so there is no point at which Framer Motion resets the
 * already-visible first page to its `initial` state before animating it
 * back in (the flash this was built to fix).
 */
const subscribe = () => () => {}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    // false during SSR and the first client render (matching exactly),
    // true from the next render onward — React's own primitive for "has
    // this component committed on the client yet", with no effect/setState
    // cascade involved.
    mounted = React.useSyncExternalStore(
      subscribe,
      () => true,
      () => false
    )

  if (!mounted) return <>{children}</>

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
