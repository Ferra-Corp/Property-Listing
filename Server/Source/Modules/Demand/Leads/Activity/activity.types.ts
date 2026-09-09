/**
 * `type` is a free-form VARCHAR(24) in the schema, not a Postgres enum, so it isn't
 * restricted to a TS union here. The conventional values noted in the SQL comment are:
 * note | call | whatsapp | email | meeting | status_change
 */
export type LeadActivity = {
  id: string;
  lead_id: string;
  user_id: string | null;
  type: string;
  body: string | null;
  occurred_at: string;
  created_at: string;
};

export type createLeadActivityDTO = {
  lead_id: string;
  user_id?: string | null;
  type: string;
  body?: string | null;
  occurred_at?: string;
};

export interface ActivityRepository {
  createActivity: (details: createLeadActivityDTO) => Promise<LeadActivity>;
  getActivities: () => Promise<LeadActivity[]>;
  getActivitiesByLead: (leadId: string) => Promise<LeadActivity[]>;
}

export interface ActivityService {
  createActivity: (details: createLeadActivityDTO) => Promise<LeadActivity>;
  getActivities: () => Promise<LeadActivity[]>;
  getActivitiesByLead: (leadId: string) => Promise<LeadActivity[]>;
}
