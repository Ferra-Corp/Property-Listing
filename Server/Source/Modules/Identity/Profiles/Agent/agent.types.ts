export type AgentProfile = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  license_number: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email_public: string | null;
  specializations: string[];
  languages: string[];
  years_experience: number | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createAgentProfileDTO = {
  user_id: string;
  slug: string;
  display_name: string;
  title?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  license_number?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  email_public?: string | null;
  specializations?: string[];
  languages?: string[];
  years_experience?: number | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

/** A PATCH-only shape for TEXT[] columns: adds or removes the given values instead of replacing the whole array. */
export type ArrayFieldOp = {
  action: "add" | "subtract";
  values: string[];
};

export function isArrayFieldOp(value: unknown): value is ArrayFieldOp {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ((value as any).action === "add" || (value as any).action === "subtract") &&
    Array.isArray((value as any).values) &&
    (value as any).values.every((item: unknown) => typeof item === "string")
  );
}

export type UpdateAgentProfileDTO = Partial<
  Omit<createAgentProfileDTO, "user_id" | "specializations" | "languages">
> & {
  specializations?: string[] | ArrayFieldOp;
  languages?: string[] | ArrayFieldOp;
};

export interface AgentRepository {
  createAgentProfile: (details: createAgentProfileDTO) => Promise<AgentProfile>;
  editAgentProfile: (
    id: string,
    details: UpdateAgentProfileDTO,
  ) => Promise<AgentProfile>;
  getAgentProfile: (
    id: string,
    publicOnly?: boolean,
  ) => Promise<AgentProfile | null>;
  getAgentProfiles: (publicOnly?: boolean) => Promise<AgentProfile[]>;
  deleteAgentProfile: (id: string) => Promise<void>;
}

export interface AgentService {
  createAgentProfile: (details: createAgentProfileDTO) => Promise<AgentProfile>;
  editAgentProfile: (
    id: string,
    details: UpdateAgentProfileDTO,
  ) => Promise<AgentProfile>;
  getAgentProfile: (id: string, publicOnly?: boolean) => Promise<AgentProfile>;
  getAgentProfiles: (publicOnly?: boolean) => Promise<AgentProfile[]>;
  deleteAgentProfile: (id: string) => Promise<void>;
}
