export type SiteSetting = {
  key: string;
  value: Record<string, any>;
  group_name: string;
  updated_by: string | null;
  updated_at: string;
};

export type createSiteSettingDTO = {
  key: string;
  value: Record<string, any>;
  group_name?: string;
  updated_by?: string | null;
};

export type UpdateSiteSettingDTO = Partial<
  Omit<createSiteSettingDTO, "key">
>;

export interface SettingsRepository {
  createSetting: (details: createSiteSettingDTO) => Promise<SiteSetting>;
  editSetting: (
    key: string,
    details: UpdateSiteSettingDTO,
  ) => Promise<SiteSetting>;
  getSettings: () => Promise<SiteSetting[]>;
  deleteSetting: (key: string) => Promise<void>;
}

export interface SettingsService {
  createSetting: (details: createSiteSettingDTO) => Promise<SiteSetting>;
  editSetting: (
    key: string,
    details: UpdateSiteSettingDTO,
  ) => Promise<SiteSetting>;
  getSettings: () => Promise<SiteSetting[]>;
  deleteSetting: (key: string) => Promise<void>;
}
