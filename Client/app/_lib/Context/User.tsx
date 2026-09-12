"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  InviteUserDTO,
  PublicUser,
  UpdateUserDTO,
  type UserContext,
} from "../Types/User"

const UserContext = createContext<UserContext>({
  users: [],
  inviteUser: () => Promise.resolve(),
  editUser: () => Promise.resolve(),
  fetchUser: async () => null,
  fetchUsers: () => Promise.resolve(),
  deleteUser: () => Promise.resolve(),
})

export const useUserContext = () => useContext(UserContext)

export default function UserContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [users, setUsers] = useState<PublicUser[]>([])

  const fetchUser = async (userId: string): Promise<PublicUser | null> => {
      try {
        const fetchRequest = await fetch(`/system/api/v1/users/${userId}`, {
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
    fetchUsers = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/users", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setUsers(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchUsers()
  }, [])

  const inviteUser = async (details: InviteUserDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchUsers()
      } catch (error) {
        throw error
      }
    },
    editUser = async (userId: string, details: UpdateUserDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchUsers()
      } catch (error) {
        throw error
      }
    },
    deleteUser = async (userId: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/users/${userId}`, {
            method: "DELETE",
          }),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await fetchUsers()
      } catch (error) {
        throw error
      }
    }

  return (
    <UserContext.Provider
      value={{ users, inviteUser, editUser, fetchUser, fetchUsers, deleteUser }}
    >
      {children}
    </UserContext.Provider>
  )
}
