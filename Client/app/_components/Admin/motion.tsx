"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "../../_components/ui/button"
import { cn } from "cn"

const EASE = [0.16, 1, 0.3, 1] as const

/** Fades a page's content up on mount — the admin's page/tab transition. */
export function PageIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** A queue/register row — staggered entrance, a slight lift on hover. */
export function RowIn({
  index = 0,
  className,
  children,
}: {
  index?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      transition={{
        duration: 0.22,
        delay: Math.min(index, 12) * 0.028,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  )
}

export const MotionLink = motion(Link)
export const MotionTr = motion.tr

/** The floating drawer's contents — slides and fades in when the selection changes. */
export function PanelIn({
  panelKey,
  children,
}: {
  panelKey: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={panelKey}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 14 }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ── toasts ──
type Toast = { id: number; title: string; body?: string }
const ToastCtx = React.createContext<{
  push: (t: Omit<Toast, "id">) => void
} | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastCtx)
  if (!ctx) throw new Error("useToast used outside ToastProvider")
  return ctx.push
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random()
    setToasts((ts) => [...ts, { ...t, id }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 md:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-[var(--cl-radius-lg)] border border-[rgba(247,243,227,.18)] bg-[var(--color-accent-900)] px-4 py-3 shadow-[var(--shadow-lg)]"
            >
              <span className="text-[13.5px] text-[#F7F3E3]">{t.title}</span>
              {t.body ? (
                <span className="cl-k text-[var(--color-accent-300)]">
                  {t.body}
                </span>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

type BtnVariants = VariantProps<typeof buttonVariants>

/** A primary action button that fires a toast — for save/confirm actions with no backend yet. */
export function ToastButton({
  title,
  body,
  variant,
  size,
  block,
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  BtnVariants & { title: string; body?: string }) {
  const push = useToast()
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      onClick={(e) => {
        push({ title, body })
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
