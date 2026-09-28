import { ServiceError } from "../../../Utilities/Http.js";
import { Cache } from "../../../../Configurations/Cache.js";
import type {
  createExchangeRateDTO,
  ExchangeRate,
  RateRepository,
  RateService,
  RefreshRatesResult,
  UpdateExchangeRateDTO,
} from "./rates.types.js";

// Free, keyless — every rate the currency picker or a listing price could
// ever need converts from this one base, so there's only ever one call to
// make per refresh regardless of how many currencies are active.
const PRIMARY_RATE_SOURCE = "open.er-api.com";
const BASE_CURRENCY = "KES";

type ProviderResponse = {
  result?: string;
  rates?: Record<string, number>;
};

// Deliberately uncached — see the same note on CurrencyServ. A stale rate
// isn't just a display nit here, it's a wrong number shown as fact, so this
// table always reads straight from Postgres. `cache` stays as a
// constructor param for interface consistency with the other services.
export class RateServ implements RateService {
  constructor(
    private repo: RateRepository,
    private cache: Cache,
  ) {}

  async createRate(details: createExchangeRateDTO): Promise<ExchangeRate> {
    if (!details)
      throw new ServiceError("Exchange rate details must be provided", 400);

    const allowedFields: (keyof createExchangeRateDTO)[] = [
      "base_currency",
      "target_currency",
      "rate",
      "source",
      "rate_date",
    ];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    return this.repo.createRate(details);
  }

  async editRate(
    id: string,
    details: UpdateExchangeRateDTO,
  ): Promise<ExchangeRate> {
    if (!id || !details)
      throw new ServiceError(
        "Exchange rate id and details must be provided",
        400,
      );

    const allowedFields: (keyof UpdateExchangeRateDTO)[] = [
      "base_currency",
      "target_currency",
      "rate",
      "source",
      "rate_date",
    ];

    let filteredDetails: UpdateExchangeRateDTO = {};

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    return this.repo.editRate(id, filteredDetails);
  }

  async getRates(): Promise<ExchangeRate[]> {
    return this.repo.getRates();
  }

  async deleteRate(id: string): Promise<void> {
    if (!id) throw new ServiceError("Exchange rate id must be provided", 404);

    await this.repo.deleteRate(id);
  }

  async refreshRates(
    activeCurrencyCodes: string[],
  ): Promise<RefreshRatesResult> {
    const targets = activeCurrencyCodes.filter(
      (code) => code !== BASE_CURRENCY,
    );

    if (targets.length === 0)
      return { updated: [], skipped: [], source: PRIMARY_RATE_SOURCE };

    let payload: ProviderResponse;

    try {
      const providerResponse = await fetch(
        `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
      );

      if (!providerResponse.ok)
        throw new Error(`responded with ${providerResponse.status}`);

      payload = (await providerResponse.json()) as ProviderResponse;
    } catch (error) {
      throw new ServiceError(
        `Couldn't reach the exchange rate provider (${PRIMARY_RATE_SOURCE}): ${(error as Error).message}`,
        502,
      );
    }

    if (payload.result !== "success" || !payload.rates)
      throw new ServiceError(
        `The exchange rate provider (${PRIMARY_RATE_SOURCE}) didn't return usable rates`,
        502,
      );

    const rates = payload.rates;
    const today = new Date().toISOString().slice(0, 10);
    const updated: ExchangeRate[] = [];
    const skipped: string[] = [];

    for (const target of targets) {
      const rate = rates[target];

      if (rate == null) {
        skipped.push(target);
        continue;
      }

      const savedRate = await this.repo.upsertRate({
        base_currency: BASE_CURRENCY,
        target_currency: target,
        rate,
        source: PRIMARY_RATE_SOURCE,
        rate_date: today,
      });

      updated.push(savedRate);
    }

    return { updated, skipped, source: PRIMARY_RATE_SOURCE };
  }
}
