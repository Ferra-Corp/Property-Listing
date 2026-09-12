export type Currency = {
  code: string
  symbol: string
  name: string
  decimal_places: number
  is_active: boolean
  sort_order: number
}

export type UpdateCurrencyDTO = Partial<Currency>

export type CurrencyContext = {
  currencies: Currency[]
  createCurrency: (details: Currency) => Promise<void>
  editCurrency: (code: string, details: UpdateCurrencyDTO) => Promise<void>
  getCurrencies: () => Promise<void>
  deleteCurrency: (code: string) => Promise<void>
}
