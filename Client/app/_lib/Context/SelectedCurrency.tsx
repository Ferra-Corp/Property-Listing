"use client"

import { createContext, useContext, useEffect, useState } from "react"

const STORAGE_KEY = "selected-currency"
const DEFAULT_CURRENCY = "KES"

type SelectedCurrencyContext = {
  currency: string
  setCurrency: (code: string) => void
}

const SelectedCurrencyContext = createContext<SelectedCurrencyContext>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
})

export const useSelectedCurrency = () => useContext(SelectedCurrencyContext)

/**
 * The visitor's chosen display currency — set from the site header's
 * currency switcher, remembered per-browser, and read by every price
 * display on the site (listings, services) to convert via ExchangeRateContext.
 */
export default function SelectedCurrencyProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCurrencyState(stored)
    } catch {
      // localStorage unavailable — fall back to the default silently
    }
  }, [])

  const setCurrency = (code: string) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // localStorage unavailable — selection just won't persist
    }
  }

  return (
    <SelectedCurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </SelectedCurrencyContext.Provider>
  )
}
