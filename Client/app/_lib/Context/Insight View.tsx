"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createInsightViewDTO,
  InsightView,
  type InsightViewContext,
} from "../Types/Insight View"

const InsightViewContext = createContext<InsightViewContext>({
  views: [],
  createView: () => Promise.resolve(),
  getViews: () => Promise.resolve(),
})

export const useInsightViewContext = () => useContext(InsightViewContext)

export default function InsightViewContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [views, setViews] = useState<InsightView[]>([])

  const getViews = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/insight-views", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setViews(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createView = async (details: createInsightViewDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/insight-views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getViews()
  }, [])

  return (
    <InsightViewContext.Provider value={{ views, createView, getViews }}>
      {children}
    </InsightViewContext.Provider>
  )
}
