"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createSiteSettingDTO,
  type SettingContext,
  SiteSetting,
  UpdateSiteSettingDTO,
} from "../Types/Site Setting"

const SettingContext = createContext<SettingContext>({
  loading: false,
  settings: [],
  createSetting: () => Promise.resolve(),
  editSetting: () => Promise.resolve(),
  getSettings: () => Promise.resolve(),
  deleteSetting: () => Promise.resolve(),
})

export const useSettingContext = () => useContext(SettingContext)

export default function SettingContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<SiteSetting[]>([]),
    [loading, setLoading] = useState(true)

  const getSettings = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/settings", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setSettings(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createSetting = async (details: createSiteSettingDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await getSettings()
      } catch (error) {
        throw error
      }
    },
    editSetting = async (key: string, details: UpdateSiteSettingDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/settings/${key}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await getSettings()
      } catch (error) {
        throw error
      }
    },
    deleteSetting = async (key: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/settings/${key}`, {
            method: "DELETE",
          }),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await getSettings()
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getSettings().finally(() => setLoading(false))
  }, [])

  return (
    <SettingContext.Provider
      value={{
        loading,
        settings,
        createSetting,
        editSetting,
        getSettings,
        deleteSetting,
      }}
    >
      {children}
    </SettingContext.Provider>
  )
}
