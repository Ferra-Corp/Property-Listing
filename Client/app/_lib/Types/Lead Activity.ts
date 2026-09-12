/**
 * `type` is a free-form value in the schema, not a fixed union. The conventional values are:
 * note | call | whatsapp | email | meeting | status_change
 */
export type LeadActivity = {
  id: string
  lead_id: string
  user_id: string | null
  type: string
  body: string | null
  occurred_at: string
  created_at: string
}

export type createLeadActivityDTO = {
  lead_id: string
  type: string
  body?: string | null
  occurred_at?: string
}

export type ActivityContext = {
  createActivity: (details: createLeadActivityDTO) => Promise<void>
  getActivities: () => Promise<LeadActivity[]>
  getActivitiesByLead: (leadId: string) => Promise<LeadActivity[]>
}
