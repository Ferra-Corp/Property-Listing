"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  AgentProfile,
  type AgentContext,
  UpdateAgentProfileDTO,
} from "../Types/Agent"

const AgentContext = createContext<AgentContext>({
  loading: false,
  agents: [],
  editAgentProfile: () => Promise.resolve(),
  fetchAgentProfile: async () => null,
  fetchAgentProfiles: () => Promise.resolve(),
  deleteAgentProfile: () => Promise.resolve(),
})

export const useAgentContext = () => useContext(AgentContext)

export default function AgentContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [agents, setAgents] = useState<AgentProfile[]>([]),
    [loading, setLoading] = useState(true)

  const fetchAgentProfile = async (
      agentId: string,
    ): Promise<AgentProfile | null> => {
      try {
        const fetchRequest = await fetch(`/system/api/v1/agents/${agentId}`, {
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
    fetchAgentProfiles = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/agents", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setAgents(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchAgentProfiles().finally(() => setLoading(false))
  }, [])

  const editAgentProfile = async (
      agentId: string,
      details: UpdateAgentProfileDTO,
    ) => {
      try {
        const editRequest = await fetch(`/system/api/v1/agents/${agentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchAgentProfiles()
      } catch (error) {
        throw error
      }
    },
    deleteAgentProfile = async (agentId: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/agents/${agentId}`, {
          method: "DELETE",
        })

        // The backend returns 204 with no body on success — only the
        // error path has JSON to parse.
        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }

        await fetchAgentProfiles()
      } catch (error) {
        throw error
      }
    }

  return (
    <AgentContext.Provider
      value={{
        loading,
        agents,
        editAgentProfile,
        fetchAgentProfile,
        fetchAgentProfiles,
        deleteAgentProfile,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}
