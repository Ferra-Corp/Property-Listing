"use client"

import { createContext, useContext } from "react"
import {
  type ActivityContext,
  createLeadActivityDTO,
  LeadActivity,
} from "../Types/Lead Activity"

const ActivityContext = createContext<ActivityContext>({
  createActivity: () => Promise.resolve(),
  getActivities: () => Promise.resolve([]),
  getActivitiesByLead: () => Promise.resolve([]),
})

export const useActivityContext = () => useContext(ActivityContext)

export default function ActivityContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const createActivity = async (details: createLeadActivityDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/lead-activities", {
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
    getActivities = async (): Promise<LeadActivity[]> => {
      try {
        const fetchRequest = await fetch("/system/api/v1/lead-activities", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        return fetchResponse
      } catch (error) {
        throw error
      }
    },
    getActivitiesByLead = async (leadId: string): Promise<LeadActivity[]> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/lead-activities/${leadId}`,
            {
              method: "GET",
            },
          ),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        return fetchResponse
      } catch (error) {
        throw error
      }
    }

  return (
    <ActivityContext.Provider
      value={{ createActivity, getActivities, getActivitiesByLead }}
    >
      {children}
    </ActivityContext.Provider>
  )
}
