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

export type PublicUser = Omit<User, "password_hash">;

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
}

export interface UserService {
  createUser: (details: createUserDTO) => Promise<PublicUser>;
  editUser: (id: string, details: UpdateUserDTO) => Promise<PublicUser>;
  getUser: (id: string) => Promise<PublicUser>;
  getUsers: () => Promise<PublicUser[]>;
  deleteUser: (id: string) => Promise<void>;
}
