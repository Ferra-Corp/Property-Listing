import type {
  AreaUnit,
  PropertySubtype,
  PropertyType,
} from "../../Inventory/Listing/listing.types.js";

export type RequestStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PropertyCondition = "good" | "average" | "poor";

export type ValuationRequest = {
  id: string;
  lead_id: string;
  property_type: PropertyType;
  property_subtype: PropertySubtype | null;
  location_label: string;
  country_code: string;
  state_region: string | null;
  city: string | null;
  neighbourhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area: number | null;
  floor_area_unit: AreaUnit | null;
  land_area: number | null;
  land_area_unit: AreaUnit | null;
  owner_expectation: number | null;
  visit_scheduled_at: string | null;
  condition: PropertyCondition | null;
  evaluation_notes: string | null;
  estimated_value: number | null;
  currency_code: string;
  valued_at: string | null;
  valued_by: string | null;
  list_out: boolean;
  converted_listing_id: string | null;
  assigned_agent_id: string | null;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createValuationRequestDTO = {
  /**
   * Provide lead_id directly (e.g. staff logging a request against a known lead), OR
   * omit it and supply full_name + phone instead — the service will reuse an existing
   * lead with that phone number, or create a new one, exactly as a public visitor's
   * "get a valuation" form submission does.
   */
  lead_id?: string;
  full_name?: string;
  phone?: string;
  email?: string | null;
  whatsapp_number?: string | null;
  property_type: PropertyType;
  property_subtype?: PropertySubtype | null;
  location_label: string;
  country_code?: string;
  state_region?: string | null;
  city?: string | null;
  neighbourhood?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_area?: number | null;
  floor_area_unit?: AreaUnit | null;
  land_area?: number | null;
  land_area_unit?: AreaUnit | null;
  owner_expectation?: number | null;
  message?: string | null;
};

/**
 * Everything below is filled in by the agent after the site visit — PATCH-only,
 * never part of the visitor-submitted create payload.
 */
export type UpdateValuationRequestDTO = Partial<createValuationRequestDTO> & {
  visit_scheduled_at?: string | null;
  condition?: PropertyCondition | null;
  evaluation_notes?: string | null;
  estimated_value?: number | null;
  currency_code?: string;
  valued_at?: string | null;
  valued_by?: string | null;
  list_out?: boolean;
  converted_listing_id?: string | null;
  assigned_agent_id?: string | null;
  status?: RequestStatus;
};

/** Just enough of the signed-in staff member to decide whose requests they
 * can see or touch — an Agent's own book only, everyone else unrestricted. */
export type RequestingStaff = { id: string; role: string };

export interface ValuationRepository {
  createValuationRequest: (
    details: createValuationRequestDTO,
  ) => Promise<ValuationRequest>;
  editValuationRequest: (
    id: string,
    details: UpdateValuationRequestDTO,
  ) => Promise<ValuationRequest>;
  getValuationRequest: (id: string) => Promise<ValuationRequest | null>;
  getValuationRequests: () => Promise<ValuationRequest[]>;
  deleteValuationRequest: (id: string) => Promise<void>;
}

export interface ValuationService {
  createValuationRequest: (
    details: createValuationRequestDTO,
  ) => Promise<ValuationRequest>;
  editValuationRequest: (
    id: string,
    details: UpdateValuationRequestDTO,
    requester: RequestingStaff,
  ) => Promise<ValuationRequest>;
  getValuationRequest: (
    id: string,
    requester: RequestingStaff,
  ) => Promise<ValuationRequest>;
  getValuationRequests: (
    requester: RequestingStaff,
  ) => Promise<ValuationRequest[]>;
  deleteValuationRequest: (
    id: string,
    requester: RequestingStaff,
  ) => Promise<void>;
}
