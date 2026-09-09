export type Log = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
};

export type createLogDTO = Omit<Log, "id" | "created_at">;

export interface LogRepository {
  createLog: (details: createLogDTO) => Promise<Log>;
  getLogs: () => Promise<Log[]>;
}
export interface LogService {
  createLog: (details: createLogDTO) => Promise<Log>;
  getLogs: () => Promise<Log[]>;
}
