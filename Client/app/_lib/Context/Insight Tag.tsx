"use client"

import { createContext, useContext } from "react"
import {
  attachTagDTO,
  type InsightTagContext,
  InsightTag,
} from "../Types/Insight Tag"

const InsightTagContext = createContext<InsightTagContext>({
  attachTag: () => Promise.resolve(),
  detachTag: () => Promise.resolve(),
  getTagsForInsight: () => Promise.resolve([]),
})

export const useInsightTagContext = () => useContext(InsightTagContext)

export default function InsightTagContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const getTagsForInsight = async (
      insightId: string,
    ): Promise<InsightTag[]> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/insight-tags/${insightId}`,
            {
              method: "GET",
            },
          ),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        return fetchResponse
      } catch (error) {
        throw error
      }
    },
    attachTag = async (insightId: string, details: attachTagDTO) => {
      try {
        const createRequest = await fetch(
            `/system/api/v1/insight-tags/${insightId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)
      } catch (error) {
        throw error
      }
    },
    detachTag = async (insightId: string, tagId: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/insight-tags/${insightId}/${tagId}`,
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
      } catch (error) {
        throw error
      }
    }

  return (
    <InsightTagContext.Provider
      value={{ attachTag, detachTag, getTagsForInsight }}
    >
      {children}
    </InsightTagContext.Provider>
  )
}
