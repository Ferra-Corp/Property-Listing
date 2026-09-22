"use client"

import { useUserContext } from "./Context/User"
import type { UserRole } from "./Types/User"

/**
 * Mirrors `permission_group`/`ROLE_PERMISSIONS` in the backend's
 * Authorization.ts exactly — there's no shared package between Client and
 * Server in this repo, so this list has to be kept in sync by hand. The
 * backend is still the actual enforcement; this only decides what the UI
 * shows, so a mismatch here is a UX bug, never a security one.
 */
export type Permission =
  | "Create insight"
  | "Edit insight"
  | "Delete insight"
  | "Create service"
  | "Edit service"
  | "Delete service"
  | "Create tag"
  | "Edit tag"
  | "Delete tag"
  | "Invite users"
  | "Manage user roles"
  | "Delete users"
  | "Create listing"
  | "Edit listing"
  | "Delete listing"
  | "View logs"
  | "Create currency"
  | "Edit currency"
  | "Delete currency"
  | "Create exchange rate"
  | "Edit exchange rate"
  | "Delete exchange rate"
  | "View listing"
  | "Create site setting"
  | "Edit site setting"
  | "Delete site setting"
  | "Create notification"
  | "Edit notification"
  | "View lead"
  | "Edit lead"
  | "Delete lead"
  | "View viewing request"
  | "Edit viewing request"
  | "Delete viewing request"
  | "View valuation request"
  | "Edit valuation request"
  | "Delete valuation request"
  | "View subscriber"
  | "Edit subscriber"
  | "Delete subscriber"

const ALL_PERMISSIONS: Permission[] = [
  "Create insight",
  "Edit insight",
  "Delete insight",
  "Create service",
  "Edit service",
  "Delete service",
  "Create tag",
  "Edit tag",
  "Delete tag",
  "Invite users",
  "Manage user roles",
  "Delete users",
  "Create listing",
  "Edit listing",
  "Delete listing",
  "View logs",
  "Create currency",
  "Edit currency",
  "Delete currency",
  "Create exchange rate",
  "Edit exchange rate",
  "Delete exchange rate",
  "View listing",
  "Create site setting",
  "Edit site setting",
  "Delete site setting",
  "Create notification",
  "Edit notification",
  "View lead",
  "Edit lead",
  "Delete lead",
  "View viewing request",
  "Edit viewing request",
  "Delete viewing request",
  "View valuation request",
  "Edit valuation request",
  "Delete valuation request",
  "View subscriber",
  "Edit subscriber",
  "Delete subscriber",
]

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ALL_PERMISSIONS,

  editor: [
    "Create insight",
    "Edit insight",
    "Delete insight",
    "Create service",
    "Edit service",
    "Delete service",
    "Create tag",
    "Edit tag",
    "Delete tag",
    "View listing",
    "View subscriber",
    "Edit subscriber",
    "Delete subscriber",
  ],

  agent: [
    "Create listing",
    "Edit listing",
    "Delete listing",
    "View listing",
    "Create notification",
    "Edit notification",
    "View lead",
    "Edit lead",
    "Delete lead",
    "View viewing request",
    "Edit viewing request",
    "Delete viewing request",
    "View valuation request",
    "Edit valuation request",
    "Delete valuation request",
  ],

  viewer: [
    "View listing",
    "View lead",
    "View viewing request",
    "View valuation request",
  ],
}

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** Reads the signed-in user's role from context and checks it against one
 * (or any of several) permissions — pass an array to ask "can they do at
 * least one of these", the shape a nav item or a page-level guard needs. */
export function usePermission(permission: Permission | Permission[]): boolean {
  const { currentUser } = useUserContext()
  const permissions = Array.isArray(permission) ? permission : [permission]
  return permissions.some((p) => hasPermission(currentUser?.role, p))
}
