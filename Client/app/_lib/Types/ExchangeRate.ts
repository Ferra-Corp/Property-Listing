export type ExchangeRate = {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  source: string
  rate_date: string
  fetched_at: string
}

export type createExchangeRateDTO = Omit<ExchangeRate, "id" | "fetched_at">

export type UpdateExchangeRateDTO = Partial<createExchangeRateDTO>

export type RateContext = {
  rates: ExchangeRate[]
  createRate: (details: createExchangeRateDTO) => Promise<void>
  editRate: (id: string, details: UpdateExchangeRateDTO) => Promise<void>
  getRates: () => Promise<void>
  deleteRate: (id: string) => Promise<void>
}
