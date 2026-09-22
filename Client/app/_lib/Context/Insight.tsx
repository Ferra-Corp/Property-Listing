"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createInsightDTO,
  type InsightContext,
  InsightWithTags,
  UpdateInsightDTO,
} from "../Types/Insight"

const InsightContext = createContext<InsightContext>({
  loading: false,
  insights: [],
  createInsight: () => Promise.resolve(),
  editInsight: () => Promise.resolve(),
  fetchInsight: async () => null,
  fetchInsights: () => Promise.resolve(),
  deleteInsight: () => Promise.resolve(),
})

export const useInsightContext = () => useContext(InsightContext)

export default function InsightContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [insights, setInsights] = useState<InsightWithTags[]>([]),
    [loading, setLoading] = useState(true)

  const fetchInsight = async (
      insightId: string,
    ): Promise<InsightWithTags | null> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/insights/${insightId}`,
            {
              method: "GET",
            },
          ),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) {
          if (fetchRequest.status == 404) return null

          throw new Error(fetchResponse.error)
        }

        return fetchResponse
      } catch (error) {
        throw error
      }
    },
    fetchInsights = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/insights", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setInsights(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchInsights().finally(() => setLoading(false))
  }, [])

  const createInsight = async (details: createInsightDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchInsights()
      } catch (error) {
        throw error
      }
    },
    editInsight = async (insightId: string, details: UpdateInsightDTO) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/insights/${insightId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchInsights()
      } catch (error) {
        throw error
      }
    },
    deleteInsight = async (insightId: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/insights/${insightId}`,
          {
            method: "DELETE",
          },
        )

        // The backend returns 204 with no body on success — only the
        // error path has JSON to parse.
        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }

        await fetchInsights()
      } catch (error) {
        throw error
      }
    }

  return (
    <InsightContext.Provider
      value={{
        loading,
        insights,
        createInsight,
        editInsight,
        fetchInsight,
        fetchInsights,
        deleteInsight,
      }}
    >
      {children}
    </InsightContext.Provider>
  )
}
