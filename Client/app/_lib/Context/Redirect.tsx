"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createRedirectDTO,
  Redirect,
  type RedirectContext,
  UpdateRedirectDTO,
} from "../Types/Redirect"

const RedirectContext = createContext<RedirectContext>({
  redirects: [],
  createRedirect: () => Promise.resolve(),
  editRedirect: () => Promise.resolve(),
  getRedirects: () => Promise.resolve(),
  deleteRedirect: () => Promise.resolve(),
})

export const useRedirectContext = () => useContext(RedirectContext)

export default function RedirectContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [redirects, setRedirects] = useState<Redirect[]>([])

  const getRedirects = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/redirects", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setRedirects(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createRedirect = async (details: createRedirectDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/redirects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await getRedirects()
      } catch (error) {
        throw error
      }
    },
    editRedirect = async (id: string, details: UpdateRedirectDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/redirects/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await getRedirects()
      } catch (error) {
        throw error
      }
    },
    deleteRedirect = async (id: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/redirects/${id}`, {
            method: "DELETE",
          }),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await getRedirects()
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getRedirects()
  }, [])

  return (
    <RedirectContext.Provider
      value={{ redirects, createRedirect, editRedirect, getRedirects, deleteRedirect }}
    >
      {children}
    </RedirectContext.Provider>
  )
}
