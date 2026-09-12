"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createExchangeRateDTO,
  ExchangeRate,
  UpdateExchangeRateDTO,
  type RateContext,
} from "../Types/ExchangeRate"

const RateContext = createContext<RateContext>({
  rates: [],
  createRate: () => Promise.resolve(),
  editRate: () => Promise.resolve(),
  getRates: () => Promise.resolve(),
  deleteRate: () => Promise.resolve(),
})

export const useRatesContext = () => useContext(RateContext)

export default function RateContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [rates, setRates] = useState<ExchangeRate[]>([])

  const getRates = async () => {
      try {
        const retrieveRequest = await fetch("/system/api/v1/exchange-rates", {
            method: "GET",
          }),
          retrieveResponse = await retrieveRequest.json()

        if (!retrieveRequest.ok) throw new Error(retrieveResponse.error)

        setRates(retrieveResponse)
      } catch (error) {
        throw error
      }
    },
    createRate = async (details: createExchangeRateDTO) => {
      try {
        const createRequest = await fetch("/system/api/v1/exchange-rates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await getRates()
      } catch (error) {
        throw error
      }
    },
    editRate = async (id: string, details: UpdateExchangeRateDTO) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/exchange-rates/${id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await getRates()
      } catch (error) {
        throw error
      }
    },
    deleteRate = async (id: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/exchange-rates/${id}`,
          {
            method: "DELETE",
          },
        )

        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }

        await getRates()
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getRates()
  }, [])

  return (
    <RateContext.Provider
      value={{ createRate, editRate, getRates, deleteRate, rates }}
    >
      {children}
    </RateContext.Provider>
  )
}
