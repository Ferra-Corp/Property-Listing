import type { AreaUnit, PropertySubtype, PropertyType } from "./Listing"

export type RequestStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

export type PropertyCondition = "good" | "average" | "poor"

export type ValuationRequest = {
  id: string
  lead_id: string
  property_type: PropertyType
  property_subtype: PropertySubtype | null
  location_label: string
  country_code: string
  state_region: string | null
  city: string | null
  neighbourhood: string | null
  bedrooms: number | null
  bathrooms: number | null
  floor_area: number | null
  floor_area_unit: AreaUnit | null
  land_area: number | null
  land_area_unit: AreaUnit | null
  owner_expectation: number | null
  visit_scheduled_at: string | null
  condition: PropertyCondition | null
  evaluation_notes: string | null
  estimated_value: number | null
  currency_code: string
  valued_at: string | null
  valued_by: string | null
  list_out: boolean
  converted_listing_id: string | null
  assigned_agent_id: string | null
  status: RequestStatus
  message: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type createValuationRequestDTO = {
  /**
   * Provide lead_id directly (e.g. staff logging a request against a known lead), OR
   * omit it and supply full_name + phone instead — the service will reuse an existing
   * lead with that phone number, or create a new one, exactly as a public visitor's
   * "get a valuation" form submission does.
   */
  lead_id?: string
  full_name?: string
  phone?: string
  email?: string | null
  whatsapp_number?: string | null
  property_type: PropertyType
  property_subtype?: PropertySubtype | null
  location_label: string
  country_code?: string
  state_region?: string | null
  city?: string | null
  neighbourhood?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  floor_area?: number | null
  floor_area_unit?: AreaUnit | null
  land_area?: number | null
  land_area_unit?: AreaUnit | null
  owner_expectation?: number | null
  message?: string | null
}

/**
 * Everything below is filled in by the agent after the site visit — PATCH-only,
 * never part of the visitor-submitted create payload.
 */
export type UpdateValuationRequestDTO = Partial<createValuationRequestDTO> & {
  visit_scheduled_at?: string | null
  condition?: PropertyCondition | null
  evaluation_notes?: string | null
  estimated_value?: number | null
  currency_code?: string
  valued_at?: string | null
  valued_by?: string | null
  list_out?: boolean
  converted_listing_id?: string | null
  assigned_agent_id?: string | null
  status?: RequestStatus
}

export type ValuationContext = {
  loading: boolean
  valuationRequests: ValuationRequest[]
  createValuationRequest: (details: createValuationRequestDTO) => Promise<void>
  editValuationRequest: (
    id: string,
    details: UpdateValuationRequestDTO,
  ) => Promise<void>
  fetchValuationRequest: (id: string) => Promise<ValuationRequest | null>
  fetchValuationRequests: () => Promise<void>
  deleteValuationRequest: (id: string) => Promise<void>
}
