"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createLeadDTO,
  Lead,
  type LeadContext,
  UpdateLeadDTO,
} from "../Types/Lead"

const LeadContext = createContext<LeadContext>({
  loading: false,
  leads: [],
  createLead: () => Promise.resolve(),
  editLead: () => Promise.resolve(),
  fetchLead: async () => null,
  fetchLeads: () => Promise.resolve(),
  deleteLead: () => Promise.resolve(),
})

export const useLeadContext = () => useContext(LeadContext)

export default function LeadContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [leads, setLeads] = useState<Lead[]>([]),
    [loading, setLoading] = useState(true)

  const fetchLead = async (leadId: string): Promise<Lead | null> => {
      try {
        const fetchRequest = await fetch(`/system/api/v1/leads/${leadId}`, {
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
    fetchLeads = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/leads", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setLeads(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchLeads().finally(() => setLoading(false))
  }, [])

  const createLead = async (details: createLeadDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchLeads()
      } catch (error) {
        throw error
      }
    },
    editLead = async (leadId: string, details: UpdateLeadDTO) => {
      try {
        const editRequest = await fetch(`/system/api/v1/leads/${leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchLeads()
      } catch (error) {
        throw error
      }
    },
    deleteLead = async (leadId: string) => {
      try {
        const deleteRequest = await fetch(`/system/api/v1/leads/${leadId}`, {
            method: "DELETE",
          }),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await fetchLeads()
      } catch (error) {
        throw error
      }
    }

  return (
    <LeadContext.Provider
      value={{ loading, leads, createLead, editLead, fetchLead, fetchLeads, deleteLead }}
    >
      {children}
    </LeadContext.Provider>
  )
}
