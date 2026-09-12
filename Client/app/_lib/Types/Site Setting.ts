export type SiteSetting = {
  key: string
  value: Record<string, any>
  group_name: string
  updated_by: string | null
  updated_at: string
}

export type createSiteSettingDTO = {
  key: string
  value: Record<string, any>
  group_name?: string
  updated_by?: string | null
}

export type UpdateSiteSettingDTO = Partial<Omit<createSiteSettingDTO, "key">>

export type SettingContext = {
  settings: SiteSetting[]
  createSetting: (details: createSiteSettingDTO) => Promise<void>
  editSetting: (key: string, details: UpdateSiteSettingDTO) => Promise<void>
  getSettings: () => Promise<void>
  deleteSetting: (key: string) => Promise<void>
}
