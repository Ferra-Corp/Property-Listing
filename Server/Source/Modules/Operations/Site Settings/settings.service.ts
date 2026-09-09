import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createSiteSettingDTO,
  SettingsRepository,
  SettingsService,
  SiteSetting,
  UpdateSiteSettingDTO,
} from "./settings.types.js";

export class SettingsServ implements SettingsService {
  constructor(
    private repo: SettingsRepository,
    private cache: Cache,
  ) {}

  async createSetting(details: createSiteSettingDTO): Promise<SiteSetting> {
    if (!details)
      throw new ServiceError("Site setting details must be provided", 400);

    const allowedFields: (keyof createSiteSettingDTO)[] = ["key", "value"];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newSetting = await this.repo.createSetting(details);

    await this.cache.invalidate(CacheKeys.all(Resource.SiteSetting));

    return newSetting;
  }

  async editSetting(
    key: string,
    details: UpdateSiteSettingDTO,
  ): Promise<SiteSetting> {
    if (!key || !details)
      throw new ServiceError(
        "Setting key and setting details must be provided",
        400,
      );

    const allowedFields: (keyof UpdateSiteSettingDTO)[] = [
      "value",
      "group_name",
      "updated_by",
    ];

    let filteredDetails: UpdateSiteSettingDTO = {};

    for (let field of allowedFields) {
      const value = details[field];

      if (value == undefined || value == null) continue;

      filteredDetails[field] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedSetting = await this.repo.editSetting(key, filteredDetails);

    await this.cache.invalidate(CacheKeys.all(Resource.SiteSetting));

    return patchedSetting;
  }

  async getSettings(): Promise<SiteSetting[]> {
    return this.cache.remember(CacheKeys.all(Resource.SiteSetting), () =>
      this.repo.getSettings(),
    );
  }

  async deleteSetting(key: string): Promise<void> {
    if (!key) throw new ServiceError("Setting key must be provided", 404);

    await this.repo.deleteSetting(key);

    await this.cache.invalidate(CacheKeys.all(Resource.SiteSetting));
  }
}
