export type AgentProfile = {
  id: string
  user_id: string
  slug: string
  display_name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  license_number: string | null
  phone: string | null
  whatsapp_number: string | null
  email_public: string | null
  specializations: string[]
  languages: string[]
  years_experience: number | null
  linkedin_url: string | null
  instagram_url: string | null
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** A PATCH-only shape for TEXT[] columns: adds or removes the given values instead of replacing the whole array. */
export type ArrayFieldOp = {
  action: "add" | "subtract"
  values: string[]
}

export type UpdateAgentProfileDTO = Partial<
  Omit<
    AgentProfile,
    | "id"
    | "user_id"
    | "specializations"
    | "languages"
    | "created_at"
    | "updated_at"
    | "deleted_at"
  >
> & {
  specializations?: string[] | ArrayFieldOp
  languages?: string[] | ArrayFieldOp
}

export type AgentContext = {
  agents: AgentProfile[]
  editAgentProfile: (id: string, details: UpdateAgentProfileDTO) => Promise<void>
  fetchAgentProfile: (id: string) => Promise<AgentProfile | null>
  fetchAgentProfiles: () => Promise<void>
  deleteAgentProfile: (id: string) => Promise<void>
}
