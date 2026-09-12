"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createServiceDTO,
  Service,
  type ServiceContext,
  UpdateServiceDTO,
} from "../Types/Service"

const ServiceContext = createContext<ServiceContext>({
  services: [],
  createService: () => Promise.resolve(),
  editService: () => Promise.resolve(),
  fetchService: async () => null,
  fetchServices: () => Promise.resolve(),
  deleteService: () => Promise.resolve(),
})

export const useServiceContext = () => useContext(ServiceContext)

export default function ServiceContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [services, setServices] = useState<Service[]>([])

  const fetchService = async (serviceId: string): Promise<Service | null> => {
      try {
        const fetchRequest = await fetch(
            `/system/api/v1/services/${serviceId}`,
            {
              method: "GET",
            },
          ),
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
    fetchServices = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/services", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setServices(fetchResponse)
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    fetchServices()
  }, [])

  const createService = async (details: createServiceDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await fetchServices()
      } catch (error) {
        throw error
      }
    },
    editService = async (serviceId: string, details: UpdateServiceDTO) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/services/${serviceId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await fetchServices()
      } catch (error) {
        throw error
      }
    },
    deleteService = async (serviceId: string) => {
      try {
        const deleteRequest = await fetch(
            `/system/api/v1/services/${serviceId}`,
            {
              method: "DELETE",
            },
          ),
          deleteResponse = await deleteRequest.json()

        if (!deleteRequest.ok) throw new Error(deleteResponse.error)

        await fetchServices()
      } catch (error) {
        throw error
      }
    }

  return (
    <ServiceContext.Provider
      value={{
        services,
        createService,
        editService,
        fetchService,
        fetchServices,
        deleteService,
      }}
    >
      {children}
    </ServiceContext.Provider>
  )
}
