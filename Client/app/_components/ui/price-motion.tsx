"use client"

import { AnimatePresence, motion } from "motion/react"
import { useSelectedCurrency } from "../../_lib/Context/SelectedCurrency"
import React from "react"

export function PriceMotion({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { currency } = useSelectedCurrency()
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={`${currency}-${children}`}
        initial={{ opacity: 0, filter: "blur(4px)", y: -2 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        exit={{ opacity: 0, filter: "blur(4px)", y: 2 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}
