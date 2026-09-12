"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Log, type LogContext } from "../Types/Audit"

const LogContext = createContext<LogContext>({
  logs: [],
  getLogs: async () => {},
})

export const useLogsContext = () => useContext(LogContext)

export default function LogContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [logs, setLogs] = useState<Log[]>([])

  const getLogs = async () => {
    try {
      const fetchRequest = await fetch("/system/api/v1/audit", {
          method: "GET",
        }),
        fetchResponse = await fetchRequest.json()

      if (!fetchRequest.ok) throw new Error(fetchResponse.error)

      setLogs(fetchResponse)
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    getLogs()
  }, [])

  return (
    <LogContext.Provider value={{ logs, getLogs }}>
      {children}
    </LogContext.Provider>
  )
}
