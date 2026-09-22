"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createViewingRequestDTO,
  UpdateViewingRequestDTO,
  type ViewingContext,
  ViewingRequest,
} from "../Types/Viewing Request"

const ViewingContext = createContext<ViewingContext>({
  loading: false,
  viewingRequests: [],
  createViewingRequest: () => Promise.resolve(),
  editViewingRequest: () => Promise.resolve(),
  fetchViewingRequest: async () => null,
  fetchViewingRequests: () => Promise.resolve(),
  deleteViewingRequest: () => Promise.resolve(),
})

export const useViewingContext = () => useContext(ViewingContext)

export default function ViewingContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [viewingRequests, setViewingRequests] = useState<ViewingRequest[]>([]),
    [loading, setLoading] = useState(true)

  const fetchViewingRequest = async (
      viewingId: string,
    ): Promise<ViewingRequest | null> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/viewing-requests/${viewingId}`,
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
    fetchViewingRequests = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/viewing-requests", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setViewingRequests(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    // Mounted for every signed-in role regardless of whether they can
    // actually read viewing requests — a permission-denied role should
    // just see an empty list, not an unhandled rejection on page load.
    fetchViewingRequests()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const createViewingRequest = async (details: createViewingRequestDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/viewing-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchViewingRequests()
      } catch (error) {
        throw error
      }
    },
    editViewingRequest = async (
      viewingId: string,
      details: UpdateViewingRequestDTO,
    ) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/viewing-requests/${viewingId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchViewingRequests()
      } catch (error) {
        throw error
      }
    },
    deleteViewingRequest = async (viewingId: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/viewing-requests/${viewingId}`,
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

        await fetchViewingRequests()
      } catch (error) {
        throw error
      }
    }

  return (
    <ViewingContext.Provider
      value={{
        loading,
        viewingRequests,
        createViewingRequest,
        editViewingRequest,
        fetchViewingRequest,
        fetchViewingRequests,
        deleteViewingRequest,
      }}
    >
      {children}
    </ViewingContext.Provider>
  )
}
