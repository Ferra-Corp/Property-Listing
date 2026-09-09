import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createExchangeRateDTO,
  ExchangeRate,
  RateRepository,
  RateService,
  UpdateExchangeRateDTO,
} from "./rates.types.js";

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

    const newRate = await this.repo.createRate(details);

    await this.cache.invalidate(CacheKeys.all(Resource.ExchangeRate));

    return newRate;
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

    const patchedRate = await this.repo.editRate(id, filteredDetails);

    await this.cache.invalidate(CacheKeys.all(Resource.ExchangeRate));

    return patchedRate;
  }

  async getRates(): Promise<ExchangeRate[]> {
    return this.cache.remember(CacheKeys.all(Resource.ExchangeRate), () =>
      this.repo.getRates(),
    );
  }

  async deleteRate(id: string): Promise<void> {
    if (!id) throw new ServiceError("Exchange rate id must be provided", 404);

    await this.repo.deleteRate(id);

    await this.cache.invalidate(CacheKeys.all(Resource.ExchangeRate));
  }
}
