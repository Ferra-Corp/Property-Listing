"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createListingViewDTO,
  ListingView,
  type ListingViewContext,
} from "../Types/Listing View"

const ListingViewContext = createContext<ListingViewContext>({
  views: [],
  createView: () => Promise.resolve(),
  getViews: () => Promise.resolve(),
})

export const useListingViewContext = () => useContext(ListingViewContext)

export default function ListingViewContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [views, setViews] = useState<ListingView[]>([])

  const getViews = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/listing-views", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setViews(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createView = async (details: createListingViewDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/listing-views", {
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
    // Not currently mounted anywhere, but if it is later: a permission-
    // denied role should just see an empty list, not an unhandled rejection.
    getViews().catch(() => {})
  }, [])

  return (
    <ListingViewContext.Provider value={{ views, createView, getViews }}>
      {children}
    </ListingViewContext.Provider>
  )
}
