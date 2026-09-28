import type { ExchangeRate } from "../../_lib/Types/ExchangeRate"

/** KES is the till currency every listing price is actually stored in —
 * always shown, never one of the "pick up to 4" slots. */
export const BASE_CURRENCY = "KES"

/** Site header only has room for KES plus a handful of others before the
 * switcher itself becomes the thing that doesn't fit. */
export const MAX_ADDITIONAL_CURRENCIES = 4

export type CuratedCurrency = {
  code: string
  symbol: string
  name: string
  decimal_places: number
}

/**
 * A starter list covering the realistic diaspora/international buyer
 * markets (Gulf, Western, regional East African) — not exhaustive. A
 * currency already active in the database but missing here still shows up
 * on the page (see `mergeCurrencyRows`); this list only supplies the
 * symbol/name/decimal defaults for ones not yet added.
 */
export const CURATED_CURRENCIES: CuratedCurrency[] = [
  { code: "KES", symbol: "KES", name: "Kenyan Shilling", decimal_places: 2 },
  {
    code: "USD",
    symbol: "$",
    name: "United States Dollar",
    decimal_places: 2,
  },
  { code: "EUR", symbol: "€", name: "Euro", decimal_places: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", decimal_places: 2 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", decimal_places: 2 },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", decimal_places: 2 },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", decimal_places: 2 },
  { code: "ZAR", symbol: "R", name: "South African Rand", decimal_places: 2 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", decimal_places: 2 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", decimal_places: 2 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimal_places: 2 },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", decimal_places: 2 },
  { code: "AUD", symbol: "$", name: "Australian Dollar", decimal_places: 2 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", decimal_places: 2 },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling", decimal_places: 0 },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", decimal_places: 0 },
  { code: "RWF", symbol: "FRw", name: "Rwandan Franc", decimal_places: 0 },
]

export type CurrencyRow = {
  curated: CuratedCurrency
  /** null when this currency has never been added to the database at all —
   * checking it for the first time creates it. */
  saved: {
    code: string
    symbol: string
    name: string
    decimal_places: number
    is_active: boolean
    sort_order: number
  } | null
}

/** The curated list, plus any currency already in the database that isn't
 * on it (added by hand at some point) — so nothing already active ever
 * silently disappears from this page for not being in the starter set. */
export function mergeCurrencyRows(
  currencies: CurrencyRow["saved"][]
): CurrencyRow[] {
  const byCode = new Map(currencies.map((c) => [c!.code, c!]))
  const curatedCodes = new Set(CURATED_CURRENCIES.map((c) => c.code))

  const curatedRows = CURATED_CURRENCIES.map((curated) => ({
    curated,
    saved: byCode.get(curated.code) ?? null,
  }))

  const extraRows = currencies
    .filter((c) => !curatedCodes.has(c!.code))
    .map((c) => ({
      curated: {
        code: c!.code,
        symbol: c!.symbol,
        name: c!.name,
        decimal_places: c!.decimal_places,
      },
      saved: c,
    }))

  return [...curatedRows, ...extraRows]
}

/** Most recent rate on file for KES → targetCode — refreshing keeps one row
 * per day for an audit trail, so more than one can exist for the same
 * pair over time. */
export function latestRateFor(
  rates: ExchangeRate[],
  targetCode: string
): ExchangeRate | null {
  const candidates = rates.filter(
    (r) => r.base_currency === BASE_CURRENCY && r.target_currency === targetCode
  )
  if (candidates.length === 0) return null

  return candidates.reduce((newest, candidate) =>
    new Date(candidate.rate_date) > new Date(newest.rate_date)
      ? candidate
      : newest
  )
}
