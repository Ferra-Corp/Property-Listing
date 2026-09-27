"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

export type ToastKind = "success" | "error" | "info"

type Toast = {
  id: number
  kind: ToastKind
  message: string
}

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => {},
})

export function useToast() {
  return React.useContext(ToastContext)
}

/**
 * Lightweight, dependency-free toast queue. Mounted once at the site
 * chrome level so any client component can call `toast()`.
 * Nothing gets torn down on route change — the animation handles that.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const idRef = React.useRef(0)

  const toast = React.useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, kind, message }])
    // Auto-dismiss after 4s. AnimatePresence handles the fade-out.
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = React.useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-3"
        style={{
          bottom: "calc(var(--wa-bar-height, 0px) + env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={
                "pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-[13.5px] shadow-(--shadow-md) backdrop-blur-sm " +
                (t.kind === "success"
                  ? "border-(--color-accent) bg-(--color-bg) text-(--color-text)"
                  : t.kind === "error"
                    ? "border-(--color-accent-2) bg-(--color-bg) text-(--color-accent-2)"
                    : "border-(--color-divider) bg-(--color-bg) text-(--color-text)")
              }
              role={t.kind === "error" ? "alert" : "status"}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
