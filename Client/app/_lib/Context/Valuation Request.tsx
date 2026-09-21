"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createValuationRequestDTO,
  UpdateValuationRequestDTO,
  type ValuationContext,
  ValuationRequest,
} from "../Types/Valuation Request"

const ValuationContext = createContext<ValuationContext>({
  loading: false,
  valuationRequests: [],
  createValuationRequest: () => Promise.resolve(),
  editValuationRequest: () => Promise.resolve(),
  fetchValuationRequest: async () => null,
  fetchValuationRequests: () => Promise.resolve(),
  deleteValuationRequest: () => Promise.resolve(),
})

export const useValuationContext = () => useContext(ValuationContext)

export default function ValuationContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [valuationRequests, setValuationRequests] = useState<
      ValuationRequest[]
    >([]),
    [loading, setLoading] = useState(true)

  const fetchValuationRequest = async (
      valuationId: string,
    ): Promise<ValuationRequest | null> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/valuation-requests/${valuationId}`,
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
    fetchValuationRequests = async () => {
      try {
        const fetchRequest = await fetch(
            "/system/api/v1/valuation-requests",
            {
              method: "GET",
            },
          ),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setValuationRequests(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchValuationRequests().finally(() => setLoading(false))
  }, [])

  const createValuationRequest = async (
      details: createValuationRequestDTO,
    ) => {
      try {
        const createRequest = await fetch(
            "/system/api/v1/valuation-requests",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchValuationRequests()
      } catch (error) {
        throw error
      }
    },
    editValuationRequest = async (
      valuationId: string,
      details: UpdateValuationRequestDTO,
    ) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/valuation-requests/${valuationId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchValuationRequests()
      } catch (error) {
        throw error
      }
    },
    deleteValuationRequest = async (valuationId: string) => {
      try {
        const deleteRequest = await fetch(
            `/system/api/v1/valuation-requests/${valuationId}`,
            {
              method: "DELETE",
            },
          ),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await fetchValuationRequests()
      } catch (error) {
        throw error
      }
    }

  return (
    <ValuationContext.Provider
      value={{
        loading,
        valuationRequests,
        createValuationRequest,
        editValuationRequest,
        fetchValuationRequest,
        fetchValuationRequests,
        deleteValuationRequest,
      }}
    >
      {children}
    </ValuationContext.Provider>
  )
}
