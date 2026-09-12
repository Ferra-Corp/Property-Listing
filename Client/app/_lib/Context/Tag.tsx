"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createTagDTO, Tag, type TagContext, UpdateTagDTO } from "../Types/Tag"

const TagContext = createContext<TagContext>({
  tags: [],
  createTag: () => Promise.resolve(),
  editTag: () => Promise.resolve(),
  fetchTag: async () => null,
  fetchTags: () => Promise.resolve(),
  deleteTag: () => Promise.resolve(),
})

export const useTagContext = () => useContext(TagContext)

export default function TagContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [tags, setTags] = useState<Tag[]>([])

  const fetchTag = async (tagId: string): Promise<Tag | null> => {
      try {
        const fetchRequest = await fetch(`/system/api/v1/tags/${tagId}`, {
            method: "GET",
          }),
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
    fetchTags = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/tags", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setTags(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchTags()
  }, [])

  const createTag = async (details: createTagDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchTags()
      } catch (error) {
        throw error
      }
    },
    editTag = async (tagId: string, details: UpdateTagDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/tags/${tagId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchTags()
      } catch (error) {
        throw error
      }
    },
    deleteTag = async (tagId: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/tags/${tagId}`, {
            method: "DELETE",
          }),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await fetchTags()
      } catch (error) {
        throw error
      }
    }

  return (
    <TagContext.Provider
      value={{ tags, createTag, editTag, fetchTag, fetchTags, deleteTag }}
    >
      {children}
    </TagContext.Provider>
  )
}
