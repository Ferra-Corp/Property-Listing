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

export interface RateRepository {
  createRate: (details: createExchangeRateDTO) => Promise<ExchangeRate>;
  editRate: (
    id: string,
    details: UpdateExchangeRateDTO,
  ) => Promise<ExchangeRate>;
  getRates: () => Promise<ExchangeRate[]>;
  deleteRate: (id: string) => Promise<void>;
}

export interface RateService {
  createRate: (details: createExchangeRateDTO) => Promise<ExchangeRate>;
  editRate: (
    id: string,
    details: UpdateExchangeRateDTO,
  ) => Promise<ExchangeRate>;
  getRates: () => Promise<ExchangeRate[]>;
  deleteRate: (id: string) => Promise<void>;
}
