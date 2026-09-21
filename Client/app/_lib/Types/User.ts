export type UserRole = "admin" | "agent" | "editor" | "viewer"

export type PublicUser = {
  id: string
  name: string
  email: string
  phone: string | null
  whatsapp_number: string | null
  role: UserRole
  is_active: boolean
  email_verified_at: string | null
  last_login_at: string | null
  failed_login_count: number
  locked_until: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  /** Whether a TOTP secret is on file — never the secret itself. */
  mfa_enabled: boolean
}

export type InviteUserDTO = {
  name: string
  email: string
  phone?: string | null
  whatsapp_number?: string | null
  role?: UserRole
  is_active?: boolean
}

export type UpdateUserDTO = Partial<InviteUserDTO>

export type UserContext = {
  loading: boolean
  users: PublicUser[]
  currentUser: PublicUser | null
  fetchCurrentUser: () => Promise<void>
  inviteUser: (details: InviteUserDTO) => Promise<void>
  editUser: (id: string, details: UpdateUserDTO) => Promise<void>
  fetchUser: (id: string) => Promise<PublicUser | null>
  fetchUsers: () => Promise<void>
  deleteUser: (id: string) => Promise<void>
}
