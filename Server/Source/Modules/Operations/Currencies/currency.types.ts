export type Currency = {
  code: string;
  symbol: string;
  name: string;
  decimal_places: number;
  is_active: boolean;
  sort_order: number;
};

export type UpdateCurrencyDTO = Partial<Currency>;

export interface CurrencyRepository {
  createCurrency: (details: Currency) => Promise<Currency>;
  editCurrency: (code: string, details: UpdateCurrencyDTO) => Promise<Currency>;
  getCurrencies: () => Promise<Currency[]>;
  deleteCurrency: (code: string) => Promise<void>;
}

export interface CurrencyService {
  createCurrency: (details: Currency) => Promise<Currency>;
  editCurrency: (code: string, details: UpdateCurrencyDTO) => Promise<Currency>;
  getCurrencies: () => Promise<Currency[]>;
  deleteCurrency: (code: string) => Promise<void>;
}
