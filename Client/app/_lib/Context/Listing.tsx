"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createListingDTO,
  ListingWithMedia,
  ListingWithThumbnail,
  UpdateListingDTO,
  type ListingContext,
} from "../Types/Listing"

const ListingContext = createContext<ListingContext>({
  loading: false,
  listings: [],
  createListing: async () => Promise.resolve(),
  editListing: async () => Promise.resolve(),
  fetchListing: async () => null,
  fetchListings: () => Promise.resolve(),
  deleteListing: () => Promise.resolve(),
})

export const useListingContext = () => useContext(ListingContext)

export default function ListingContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [listings, setListings] = useState<ListingWithThumbnail[]>([]),
    [loading, setLoading] = useState(true)

  const fetchListing = async (
      listingId: string
    ): Promise<ListingWithMedia | null> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/listing/${listingId}`,
            {
              method: "GET",
            }
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
    fetchListings = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/listing", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setListings(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchListings().finally(() => setLoading(false))
  }, [])

  const createListing = async (details: createListingDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchListings()
      } catch (error) {
        throw error
      }
    },
    editListing = async (listingId: string, details: UpdateListingDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/listing/${listingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchListings()
      } catch (error) {
        throw error
      }
    },
    deleteListing = async (listingId: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/listing/${listingId}`,
          {
            method: "DELETE",
          }
        )

        // The backend returns 204 with no body on success — only the
        // error path has JSON to parse.
        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }

        await fetchListings()
      } catch (error) {
        throw error
      }
    }

  return (
    <ListingContext.Provider
      value={{
        loading,
        listings,
        createListing,
        editListing,
        fetchListing,
        fetchListings,
        deleteListing,
      }}
    >
      {children}
    </ListingContext.Provider>
  )
}
