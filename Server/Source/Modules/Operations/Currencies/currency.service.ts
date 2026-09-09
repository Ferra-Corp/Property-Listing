import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  Currency,
  CurrencyRepository,
  CurrencyService,
  UpdateCurrencyDTO,
} from "./currency.types.js";

export class CurrencyServ implements CurrencyService {
  constructor(
    private repo: CurrencyRepository,
    private cache: Cache,
  ) {}

  async createCurrency(details: Currency): Promise<Currency> {
    if (!details)
      throw new ServiceError("Currency details missing, must be provided", 400);

    const allowedFields: (keyof Currency)[] = [
      "code",
      "decimal_places",
      "is_active",
      "name",
      "sort_order",
      "symbol",
    ];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newCurrency = await this.repo.createCurrency(details);

    await this.cache.invalidate(CacheKeys.all(Resource.Currency));

    return newCurrency;
  }

  async editCurrency(
    code: string,
    details: UpdateCurrencyDTO,
  ): Promise<Currency> {
    if (!code || !details)
      throw new ServiceError(
        "Currency code and currency details must be provided",
        400,
      );

    const allowedFields: (keyof UpdateCurrencyDTO)[] = [
      "code",
      "decimal_places",
      "is_active",
      "name",
      "sort_order",
      "symbol",
    ];

    let filteredDetails: UpdateCurrencyDTO = {};

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedCurrency = await this.repo.editCurrency(code, filteredDetails);

    await this.cache.invalidate(CacheKeys.all(Resource.Currency));

    return patchedCurrency;
  }

  async getCurrencies(): Promise<Currency[]> {
    return this.cache.remember(CacheKeys.all(Resource.Currency), () =>
      this.repo.getCurrencies(),
    );
  }

  async deleteCurrency(code: string): Promise<void> {
    if (!code) throw new ServiceError("Currency Code must be provided", 404);

    await this.repo.deleteCurrency(code);

    await this.cache.invalidate(CacheKeys.all(Resource.Currency));
  }
}
