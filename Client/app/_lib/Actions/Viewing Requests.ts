import {
  createViewingRequestDTO,
  ViewingRequest,
} from "../Types/Viewing Request"

/**
 * Public "book a viewing" submission — no staff session involved, so this
 * calls the proxy route directly rather than going through ViewingContext
 * (which auto-fetches the staff request list on mount and would 401 for a
 * visitor).
 */
export async function createViewingRequest(
  details: createViewingRequestDTO,
): Promise<ViewingRequest> {
  const createRequest = await fetch("/system/api/v1/viewing-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    }),
    createResponse = await createRequest.json()

  if (!createRequest.ok) throw new Error(createResponse.error)

  return createResponse
}
