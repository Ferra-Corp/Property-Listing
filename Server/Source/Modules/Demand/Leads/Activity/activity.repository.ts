import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  ActivityRepository,
  createLeadActivityDTO,
  LeadActivity,
} from "./activity.types.js";

export class ActivityRepo implements ActivityRepository {
  constructor(private db: Database) {}

  async createActivity(
    details: createLeadActivityDTO,
  ): Promise<LeadActivity> {
    try {
      const sqlString: string =
          "INSERT INTO lead_activities(lead_id,user_id,type,body,occurred_at) VALUES($1,$2,$3,$4,COALESCE($5,now())) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.lead_id,
          details.user_id ?? null,
          details.type,
          details.body ?? null,
          details.occurred_at ?? null,
        ]),
        activityQuery = sqlQuery as QueryResult<LeadActivity>;

      return activityQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getActivities(): Promise<LeadActivity[]> {
    try {
      const sqlString: string =
          "SELECT * FROM lead_activities ORDER BY occurred_at DESC",
        sqlQuery = await this.db.query(sqlString),
        activitiesQuery = sqlQuery as QueryResult<LeadActivity>;

      return activitiesQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getActivitiesByLead(leadId: string): Promise<LeadActivity[]> {
    try {
      const sqlString: string =
          "SELECT * FROM lead_activities WHERE lead_id=$1 ORDER BY occurred_at DESC",
        sqlQuery = await this.db.query(sqlString, [leadId]),
        activitiesQuery = sqlQuery as QueryResult<LeadActivity>;

      return activitiesQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
