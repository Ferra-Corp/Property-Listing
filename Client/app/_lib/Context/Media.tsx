"use client"

import { createContext, useContext } from "react"
import {
  createListingMediaDTO,
  ListingMedia,
  type MediaContext,
  UpdateListingMediaDTO,
} from "../Types/Media"

const MediaContext = createContext<MediaContext>({
  createMedia: () => Promise.resolve(),
  editMedia: () => Promise.resolve(),
  getMedia: () => Promise.resolve([]),
  deleteMedia: async () => {},
})

export const useMediaContext = () => useContext(MediaContext)

export default function MediaContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const createMedia = async (details: createListingMediaDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)
      } catch (error) {
        throw error
      }
    },
    editMedia = async (id: string, details: UpdateListingMediaDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/media/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)
      } catch (error) {
        throw error
      }
    },
    getMedia = async (): Promise<ListingMedia[]> => {
      try {
        const retrieveRequest = await fetch("/system/api/v1/media", {
            method: "GET",
          }),
          retrieveResponse = await retrieveRequest.json()

        if (!retrieveRequest.ok) throw new Error(retrieveResponse.error)

        return retrieveResponse
      } catch (error) {
        throw error
      }
    },
    deleteMedia = async (mediaId: string): Promise<void> => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/media/${mediaId}`, {
          method: "DELETE",
        })

        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }
      } catch (error) {
        throw error
      }
    }

  return (
    <MediaContext.Provider
      value={{
        createMedia,
        editMedia,
        getMedia,
        deleteMedia,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}
