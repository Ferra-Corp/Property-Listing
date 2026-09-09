import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  ActivityRepository,
  ActivityService,
  createLeadActivityDTO,
  LeadActivity,
} from "./activity.types.js";

const REQUIRED_ACTIVITY_FIELDS: (keyof createLeadActivityDTO)[] = [
  "lead_id",
  "type",
];

export class ActivityServ implements ActivityService {
  constructor(
    private repo: ActivityRepository,
    private cache: Cache,
  ) {}

  async createActivity(
    details: createLeadActivityDTO,
  ): Promise<LeadActivity> {
    if (!details)
      throw new ServiceError("Lead activity details must be provided", 400);

    for (let key of REQUIRED_ACTIVITY_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newActivity = await this.repo.createActivity(details);

    await this.cache.invalidate(
      CacheKeys.all(Resource.LeadActivity),
      CacheKeys.scoped(Resource.LeadActivity, newActivity.lead_id),
    );

    return newActivity;
  }

  async getActivities(): Promise<LeadActivity[]> {
    return this.cache.remember(CacheKeys.all(Resource.LeadActivity), () =>
      this.repo.getActivities(),
    );
  }

  async getActivitiesByLead(leadId: string): Promise<LeadActivity[]> {
    if (!leadId) throw new ServiceError("Lead id must be provided", 400);

    return this.cache.remember(
      CacheKeys.scoped(Resource.LeadActivity, leadId),
      () => this.repo.getActivitiesByLead(leadId),
    );
  }
}
