export type Log = {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  action: string
  changes: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
}

export type createLogDTO = Omit<Log, "id" | "created_at">

export type LogContext = {
  logs: Log[]
  getLogs: () => Promise<void>
}
