import {
  createValuationRequestDTO,
  ValuationRequest,
} from "../Types/Valuation Request"

/**
 * Public "sell or value my property" submission — no staff session involved,
 * so this calls the proxy route directly rather than going through
 * ValuationContext (which auto-fetches the staff request list on mount and
 * would 401 for a visitor).
 */
export async function createValuationRequest(
  details: createValuationRequestDTO,
): Promise<ValuationRequest> {
  const createRequest = await fetch("/system/api/v1/valuation-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    }),
    createResponse = await createRequest.json()

  if (!createRequest.ok) throw new Error(createResponse.error)

  return createResponse
}
