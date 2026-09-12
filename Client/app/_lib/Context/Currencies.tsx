"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  Currency,
  type CurrencyContext,
  UpdateCurrencyDTO,
} from "../Types/Currencies"

const CurrencyContext = createContext<CurrencyContext>({
  currencies: [],
  createCurrency: () => Promise.resolve(),
  editCurrency: () => Promise.resolve(),
  getCurrencies: () => Promise.resolve(),
  deleteCurrency: () => Promise.resolve(),
})

export const useCurrencyContext = () => useContext(CurrencyContext)

export default function CurrencyContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const getCurrencies = async () => {
      try {
        const fetchRequest = await fetch("/system/api/v1/currencies", {
            method: "GET",
          }),
          fetchResponse = await fetchRequest.json()

        if (!fetchRequest.ok) throw new Error(fetchResponse.error)

        setCurrencies(fetchResponse)
      } catch (error) {
        throw error
      }
    },
    createCurrency = async (details: Currency) => {
      try {
        const createRequest = await fetch("/system/api/v1/currencies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }),
          createResponse = await createRequest.json()

        if (!createRequest.ok) throw new Error(createResponse.error)

        await getCurrencies()
      } catch (error) {
        throw error
      }
    },
    editCurrency = async (currencyCode: string, details: UpdateCurrencyDTO) => {
      try {
        const editRequest = await fetch(
            `/system/api/v1/currencies/${currencyCode}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(details),
            },
          ),
          editResponse = await editRequest.json()

        if (!editRequest.ok) throw new Error(editResponse.error)

        await getCurrencies()
      } catch (error) {
        throw error
      }
    },
    deleteCurrency = async (currencyCode: string) => {
      try {
        const deleteRequest = await fetch(
          `/system/api/v1/currencies/${currencyCode}`,
          {
            method: "DELETE",
          },
        )

        if (!deleteRequest.ok) {
          const deleteResponse = await deleteRequest.json()
          throw new Error(deleteResponse.error)
        }

        await getCurrencies()
      } catch (error) {
        throw error
      }
    }

  useEffect(() => {
    getCurrencies()
  }, [])

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        createCurrency,
        editCurrency,
        getCurrencies,
        deleteCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}
