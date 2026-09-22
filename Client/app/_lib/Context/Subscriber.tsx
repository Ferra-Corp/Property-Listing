"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  SubscribeDTO,
  Subscriber,
  type SubscriberContext,
  UpdateSubscriberDTO,
} from "../Types/Subscriber"

const SubscriberContext = createContext<SubscriberContext>({
  loading: false,
  subscribers: [],
  getSubscribers: () => Promise.resolve(),
  createSubscriber: () => Promise.resolve(),
  editSubscriber: () => Promise.resolve(),
  deleteSubscriber: () => Promise.resolve(),
})

export const useSubscriberContext = () => useContext(SubscriberContext)

export default function SubscriberContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]),
    [loading, setLoading] = useState(true)

  const getSubscribers = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/subscribers", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setSubscribers(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createSubscriber = async (details: SubscribeDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/subscribers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await getSubscribers()
      } catch (error) {
        throw error
      }
    },
    editSubscriber = async (id: string, details: UpdateSubscriberDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/subscribers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await getSubscribers()
      } catch (error) {
        throw error
      }
    },
    deleteSubscriber = async (id: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/subscribers/${id}`, {
          method: "DELETE",
        })

        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }

        await getSubscribers()
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getSubscribers().finally(() => setLoading(false))
  }, [])

  return (
    <SubscriberContext.Provider
      value={{
        loading,
        subscribers,
        getSubscribers,
        createSubscriber,
        editSubscriber,
        deleteSubscriber,
      }}
    >
      {children}
    </SubscriberContext.Provider>
  )
}
