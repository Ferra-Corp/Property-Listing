import { createLeadDTO, Lead } from "../Types/Lead"

/**
 * Public "contact us" submission — no staff session involved, so this calls
 * the proxy route directly rather than going through LeadContext (which
 * auto-fetches the staff lead list on mount and would 401 for a visitor).
 */
export async function createLead(details: createLeadDTO): Promise<Lead> {
  const createRequest = await fetch("/system/api/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    }),
    createResponse = await createRequest.json()

  if (!createRequest.ok) throw new Error(createResponse.error)

  return createResponse
}
