import { ServiceError } from "../../../Utilities/Http.js";
import type {
  createLogDTO,
  Log,
  LogRepository,
  LogService,
} from "./audit.types.js";

export class LogServ implements LogService {
  constructor(private repo: LogRepository) {}

  async createLog(details: createLogDTO): Promise<Log> {
    const allowedFields: (keyof createLogDTO)[] = [
      "user_id",
      "action",
      "entity_id",
      "entity_type",
    ];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == null || value === undefined)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newLog = await this.repo.createLog(details);

    return newLog;
  }

  async getLogs(): Promise<Log[]> {
    const logs = await this.repo.getLogs();

    return logs;
  }
}
