"use client"

import { createContext, useContext } from "react"
import {
  attachListingDTO,
  type InsightListingContext,
  InsightListing,
} from "../Types/Insight Listing"

const InsightListingContext = createContext<InsightListingContext>({
  attachListing: () => Promise.resolve(),
  detachListing: () => Promise.resolve(),
  getListingsForInsight: () => Promise.resolve([]),
})

export const useInsightListingContext = () =>
  useContext(InsightListingContext)

export default function InsightListingContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const getListingsForInsight = async (
      insightId: string,
    ): Promise<InsightListing[]> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/insight-listings/${insightId}`,
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
    attachListing = async (insightId: string, details: attachListingDTO) => {
      try {
        const createRequest = await fetch(
            `/system/api/v1/insight-listings/${insightId}`,
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
    detachListing = async (insightId: string, listingId: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/insight-listings/${insightId}/${listingId}`,
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
    <InsightListingContext.Provider
      value={{ attachListing, detachListing, getListingsForInsight }}
    >
      {children}
    </InsightListingContext.Provider>
  )
}
