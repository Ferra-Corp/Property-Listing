import { ServiceError } from "../../../Utilities/Http.js";
import { Cache } from "../../../../Configurations/Cache.js";
import type {
  Currency,
  CurrencyRepository,
  CurrencyService,
  UpdateCurrencyDTO,
} from "./currency.types.js";

// Deliberately uncached: this table is a handful of rows, changed rarely,
// and read on every public page to decide the currency switcher — the sort
// of resource where an invalidate/refetch race (two toggles in quick
// succession leaving a stale value sitting in Redis for up to its TTL)
// costs real correctness for a saving that doesn't matter at this size.
// `cache` stays as a constructor param for interface consistency with the
// other services even though it's unused here.
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

    return this.repo.createCurrency(details);
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

    return this.repo.editCurrency(code, filteredDetails);
  }

  async getCurrencies(): Promise<Currency[]> {
    return this.repo.getCurrencies();
  }

  async deleteCurrency(code: string): Promise<void> {
    if (!code) throw new ServiceError("Currency Code must be provided", 404);

    await this.repo.deleteCurrency(code);
  }
}
