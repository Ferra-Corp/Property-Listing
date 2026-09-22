export type RequestStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type ViewingRequest = {
  id: string;
  listing_id: string;
  lead_id: string;
  preferred_date: string;
  preferred_time_slot: string | null;
  alternate_date: string | null;
  confirmed_at: string | null;
  assigned_agent_id: string | null;
  status: RequestStatus;
  message: string | null;
  internal_notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createViewingRequestDTO = {
  listing_id: string;
  /**
   * Provide lead_id directly (e.g. staff logging a request against a known lead), OR
   * omit it and supply full_name + phone instead — the service will reuse an existing
   * lead with that phone number, or create a new one, exactly as a public visitor's
   * "book a viewing" form submission does.
   */
  lead_id?: string;
  full_name?: string;
  phone?: string;
  email?: string | null;
  whatsapp_number?: string | null;
  preferred_date: string;
  preferred_time_slot?: string | null;
  alternate_date?: string | null;
  assigned_agent_id?: string | null;
  message?: string | null;
};

/** `status`, `confirmed_at`, `internal_notes` and `cancelled_reason` are staff-managed — PATCH-only. */
export type UpdateViewingRequestDTO = Partial<createViewingRequestDTO> & {
  status?: RequestStatus;
  confirmed_at?: string | null;
  internal_notes?: string | null;
  cancelled_reason?: string | null;
};

/** Just enough of the signed-in staff member to decide whose requests they
 * can see or touch — an Agent's own book only, everyone else unrestricted. */
export type RequestingStaff = { id: string; role: string };

export interface ViewingRepository {
  createViewingRequest: (
    details: createViewingRequestDTO,
  ) => Promise<ViewingRequest>;
  editViewingRequest: (
    id: string,
    details: UpdateViewingRequestDTO,
  ) => Promise<ViewingRequest>;
  getViewingRequest: (id: string) => Promise<ViewingRequest | null>;
  getViewingRequests: () => Promise<ViewingRequest[]>;
  deleteViewingRequest: (id: string) => Promise<void>;
}

export interface ViewingService {
  createViewingRequest: (
    details: createViewingRequestDTO,
  ) => Promise<ViewingRequest>;
  editViewingRequest: (
    id: string,
    details: UpdateViewingRequestDTO,
    requester: RequestingStaff,
  ) => Promise<ViewingRequest>;
  getViewingRequest: (
    id: string,
    requester: RequestingStaff,
  ) => Promise<ViewingRequest>;
  getViewingRequests: (requester: RequestingStaff) => Promise<ViewingRequest[]>;
  deleteViewingRequest: (id: string, requester: RequestingStaff) => Promise<void>;
}
