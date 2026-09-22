export type UserRole = "admin" | "agent" | "editor" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  failed_login_count: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// google_auth_secret itself is never on User at all — it lives only on the
// narrower AuthUser used to check a login, and must never reach a client.
// mfa_enabled is the one bit of that anyone else is allowed to know.
export type PublicUser = Omit<User, "password_hash"> & {
  mfa_enabled: boolean;
};

export type createUserDTO = {
  name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  whatsapp_number?: string | null;
  role?: UserRole;
  is_active?: boolean;
};

export type UpdateUserDTO = Partial<Omit<createUserDTO, "password_hash">>;

export interface UserRepository {
  createUser: (details: createUserDTO) => Promise<PublicUser>;
  editUser: (id: string, details: UpdateUserDTO) => Promise<PublicUser>;
  getUser: (id: string) => Promise<PublicUser | null>;
  getUsers: () => Promise<PublicUser[]>;
  deleteUser: (id: string) => Promise<void>;
  // A genuine row removal, distinct from deleteUser's soft delete. Only for
  // undoing an invite that never finished (e.g. the invite email failed to
  // send) — the account never existed as far as anyone but the admin who
  // triggered it is concerned, so nothing should be left behind to soft-delete.
  hardDeleteUser: (id: string) => Promise<void>;
}

export interface UserService {
  createUser: (details: createUserDTO) => Promise<PublicUser>;
  editUser: (id: string, details: UpdateUserDTO) => Promise<PublicUser>;
  getUser: (id: string) => Promise<PublicUser>;
  getUsers: () => Promise<PublicUser[]>;
  deleteUser: (id: string) => Promise<void>;
  hardDeleteUser: (id: string) => Promise<void>;
  // For writes that land through a different repository (e.g. the OTP
  // secret, owned by AuthRepository) but still need the cached PublicUser
  // to drop its stale mfa_enabled snapshot.
  invalidateUser: (id: string) => Promise<void>;
}
