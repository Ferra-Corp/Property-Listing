/** "3 days ago" / "2 months ago" / "yesterday" style relative date, past only. */
export function relativeDate(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime(),
    diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays <= 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 30) return `${diffDays} days ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`

  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`
}

/** "42m" / "6h" / "3d" — compact elapsed-time label for a queue's "waiting" column. */
export function elapsedLabel(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${Math.max(minutes, 0)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

/** "Six Questions?" → "six-questions" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** e.g. "1,920,000" — grouped, no currency symbol/code. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  )
}

/** e.g. "KES 1,920,000" */
export function formatMoney(value: number, currencyCode: string): string {
  return `${currencyCode} ${formatNumber(value)}`
}

const PRICE_PERIOD_LABEL: Record<string, string> = {
  total: "total",
  per_month: "/ month",
  per_year: "/ year",
  per_sqft_month: "/ sq ft / month",
  per_sqft_year: "/ sq ft / year",
  per_acre: "/ acre",
}

type RateLike = {
  base_currency: string
  target_currency: string
  rate: number | string
}

/**
 * Converts an amount from one currency to another using whatever
 * base→target (or target→base, inverted) rate is on file. Returns null
 * when no such rate exists, rather than a wrong number.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: RateLike[]
): number | null {
  if (fromCurrency === toCurrency) return amount

  const direct = rates.find(
    (r) => r.base_currency === fromCurrency && r.target_currency === toCurrency
  )
  if (direct) return amount * Number(direct.rate)

  const inverse = rates.find(
    (r) => r.base_currency === toCurrency && r.target_currency === fromCurrency
  )
  if (inverse) return amount / Number(inverse.rate)

  return null
}

/**
 * Formats a listing/service figure into the register's price + unit pair.
 * Pass `convertTo` + `rates` to display in a different currency than the
 * one the price is stored in — falls back to the original currency when no
 * rate is on file for the requested conversion.
 */
export function formatPrice(
  price: number | string | null,
  currencyCode: string,
  pricePeriod: string,
  priceOnRequest: boolean,
  convertTo?: { currency: string; rates: RateLike[] }
): { price: string; priceUnit: string } {
  if (priceOnRequest || price == null)
    return { price: "On request", priceUnit: "rate quoted on enquiry" }

  let amount = Number(price),
    displayCurrency = currencyCode

  if (convertTo) {
    const converted = convertAmount(
      amount,
      currencyCode,
      convertTo.currency,
      convertTo.rates
    )
    if (converted !== null) {
      amount = converted
      displayCurrency = convertTo.currency
    }
  }

  return {
    price: formatMoney(amount, displayCurrency),
    priceUnit: PRICE_PERIOD_LABEL[pricePeriod] ?? "",
  }
}

/**
 * Normalizes a phone number for a wa.me link: digits only, no leading "+".
 * A local Kenyan number starting with "0" is assumed to be missing its
 * country code and gets "254" substituted in — the only market this site
 * currently serves. Numbers already in international form pass through as-is.
 */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("0") ? `254${digits.slice(1)}` : digits
}

/** Builds a wa.me click-to-chat link with a prefilled, URL-encoded message. */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`
}

/**
 * Display form of a stored phone number: "254711000003" → "+254 711 000 003".
 * Only the Kenyan 12-digit shape is regrouped; anything else is shown
 * digits-only behind a "+" rather than guessing at another country's grouping.
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = toWhatsAppDigits(phone)
  const kenyan = digits.match(/^254(\d{3})(\d{3})(\d{3})$/)
  return kenyan ? `+254 ${kenyan[1]} ${kenyan[2]} ${kenyan[3]}` : `+${digits}`
}
