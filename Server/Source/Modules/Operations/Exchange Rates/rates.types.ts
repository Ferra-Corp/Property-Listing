export type ExchangeRate = {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  rate_date: string;
  fetched_at: string;
};

export type createExchangeRateDTO = Omit<ExchangeRate, "id" | "fetched_at">;

export type UpdateExchangeRateDTO = Partial<createExchangeRateDTO>;

export type RefreshRatesResult = {
  updated: ExchangeRate[];
  skipped: string[];
  source: string;
};

export interface RateRepository {
  createRate: (details: createExchangeRateDTO) => Promise<ExchangeRate>;
  editRate: (
    id: string,
    details: UpdateExchangeRateDTO,
  ) => Promise<ExchangeRate>;
  getRates: () => Promise<ExchangeRate[]>;
  deleteRate: (id: string) => Promise<void>;
  /** Insert-or-update on the (base, target, rate_date) unique key — used by
   * refreshRates so re-running a refresh the same day updates today's row
   * instead of failing the unique constraint. */
  upsertRate: (details: createExchangeRateDTO) => Promise<ExchangeRate>;
}

export interface RateService {
  createRate: (details: createExchangeRateDTO) => Promise<ExchangeRate>;
  editRate: (
    id: string,
    details: UpdateExchangeRateDTO,
  ) => Promise<ExchangeRate>;
  getRates: () => Promise<ExchangeRate[]>;
  deleteRate: (id: string) => Promise<void>;
  /** Pulls today's KES rates for every given currency code from the
   * configured primary source and upserts each one. */
  refreshRates: (activeCurrencyCodes: string[]) => Promise<RefreshRatesResult>;
}
