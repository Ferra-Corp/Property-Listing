import type {
  PropertySubtype,
  PropertyType,
} from "../../../Inventory/Listing/listing.types.js";

export type LeadIntent =
  | "buy"
  | "rent"
  | "lease"
  | "sell"
  | "valuation"
  | "general";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "viewing_booked"
  | "negotiating"
  | "won"
  | "lost"
  | "spam";

export type LeadSource =
  | "contact_form"
  | "listing_enquiry"
  | "valuation_form"
  | "viewing_form"
  | "whatsapp"
  | "phone"
  | "email"
  | "referral"
  | "other";

export type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  whatsapp_number: string | null;
  country_code: string | null;
  state_region: string | null;
  city: string | null;
  intent: LeadIntent;
  property_type: PropertyType | null;
  property_subtype: PropertySubtype | null;
  preferred_location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency_code: string;
  requirements: string | null;
  listing_id: string | null;
  user_id: string | null;
  source: LeadSource;
  source_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  status: LeadStatus;
  assigned_agent_id: string | null;
  first_contacted_at: string | null;
  lost_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  consent_marketing: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createLeadDTO = {
  full_name: string;
  email?: string | null;
  phone: string;
  whatsapp_number?: string | null;
  country_code?: string | null;
  state_region?: string | null;
  city?: string | null;
  intent?: LeadIntent;
  property_type?: PropertyType | null;
  property_subtype?: PropertySubtype | null;
  preferred_location?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  currency_code?: string;
  requirements?: string | null;
  listing_id?: string | null;
  user_id?: string | null;
  source?: LeadSource;
  source_page?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  assigned_agent_id?: string | null;
  first_contacted_at?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  consent_marketing?: boolean;
};

/** `status`/`lost_reason` are pipeline fields — not part of creation, only ever moved forward via PATCH. */
export type UpdateLeadDTO = Partial<createLeadDTO> & {
  status?: LeadStatus;
  lost_reason?: string | null;
};

/** Just enough of the signed-in staff member to decide whose leads they can
 * see or touch — an Agent's own book only, everyone else unrestricted. */
export type RequestingStaff = { id: string; role: string };

export interface LeadRepository {
  createLead: (details: createLeadDTO) => Promise<Lead>;
  editLead: (id: string, details: UpdateLeadDTO) => Promise<Lead>;
  getLead: (id: string) => Promise<Lead | null>;
  getLeads: () => Promise<Lead[]>;
  deleteLead: (id: string) => Promise<void>;
  /** Most recent non-deleted lead with this phone number, or null if this is a new contact. */
  findLeadByPhone: (phone: string) => Promise<Lead | null>;
}

export interface LeadService {
  createLead: (details: createLeadDTO) => Promise<Lead>;
  editLead: (
    id: string,
    details: UpdateLeadDTO,
    requester: RequestingStaff,
  ) => Promise<Lead>;
  getLead: (id: string, requester: RequestingStaff) => Promise<Lead>;
  getLeads: (requester: RequestingStaff) => Promise<Lead[]>;
  deleteLead: (id: string, requester: RequestingStaff) => Promise<void>;
  findLeadByPhone: (phone: string) => Promise<Lead | null>;
}
