"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createNotificationLogDTO,
  NotificationLog,
  type NotificationContext,
  UpdateNotificationLogDTO,
} from "../Types/Notification"

const NotificationContext = createContext<NotificationContext>({
  notifications: [],
  createNotification: () => Promise.resolve(),
  editNotification: () => Promise.resolve(),
  getNotifications: () => Promise.resolve(),
})

export const useNotificationContext = () => useContext(NotificationContext)

export default function NotificationContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [notifications, setNotifications] = useState<NotificationLog[]>([])

  const getNotifications = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/notifications", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setNotifications(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createNotification = async (details: createNotificationLogDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await getNotifications()
      } catch (error) {
        throw error
      }
    },
    editNotification = async (
      id: number,
      details: UpdateNotificationLogDTO,
    ) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/notifications/${id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await getNotifications()
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getNotifications()
  }, [])

  return (
    <NotificationContext.Provider
      value={{ notifications, createNotification, editNotification, getNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
