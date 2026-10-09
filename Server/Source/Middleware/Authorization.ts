import type { IncomingMessage } from "node:http";
import { MiddlewareError } from "../Utilities/Http.js";
import { AuthToken } from "./Authentication.js";
import type {
  PublicUser,
  UserRole,
} from "../Modules/Identity/Profiles/User/user.types.js";

export type permission_group =
  // Insights
  | "Create insight"
  | "Edit insight"
  | "Delete insight"

  // Services
  | "Create service"
  | "Edit service"
  | "Delete service"

  // Testimonials
  | "Create testimonial"
  | "Edit testimonial"
  | "Delete testimonial"

  // Tags
  | "Create tag"
  | "Edit tag"
  | "Delete tag"

  // Users
  | "Invite users"
  | "Manage user roles"
  | "Delete users"

  // Listings
  | "Create listing"
  | "Edit listing"
  | "Delete listing"

  // Audit logs
  | "View logs"

  // Currencies
  | "Create currency"
  | "Edit currency"
  | "Delete currency"

  // Exchange rates
  | "Create exchange rate"
  | "Edit exchange rate"
  | "Delete exchange rate"

  // Listing Views
  | "View listing"

  // Site settings
  | "Create site setting"
  | "Edit site setting"
  | "Delete site setting"

  // Notifications
  | "Create notification"
  | "Edit notification"

  // Leads
  | "View lead"
  | "Edit lead"
  | "Delete lead"

  // Viewing Requests
  | "View viewing request"
  | "Edit viewing request"
  | "Delete viewing request"

  // Valuation Requests
  | "View valuation request"
  | "Edit valuation request"
  | "Delete valuation request"

  // Subscribers
  | "View subscriber"
  | "Edit subscriber"
  | "Delete subscriber";

const ALL_PERMISSIONS: permission_group[] = [
  "Create insight",
  "Edit insight",
  "Delete insight",
  "Create service",
  "Edit service",
  "Delete service",
  "Create testimonial",
  "Edit testimonial",
  "Delete testimonial",
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
];

/** Each role's allowed actions — checked as a plain array membership test, nothing fancier. */
const ROLE_PERMISSIONS: Record<UserRole, permission_group[]> = {
  admin: ALL_PERMISSIONS,

  editor: [
    "Create insight",
    "Edit insight",
    "Delete insight",
    "Create service",
    "Edit service",
    "Delete service",
    "Create testimonial",
    "Edit testimonial",
    "Delete testimonial",
    "Create tag",
    "Edit tag",
    "Delete tag",
    "View listing",
    // A newsletter is a marketing artifact, not a sales one — Subscribers
    // sits with Editor alone, not Agent.
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

  // The junior-staff/intern role: read-only, but broadly — everything an
  // Agent works with, minus any ability to change it. Explicitly does NOT
  // include Subscribers (Editor's alone) or anything content/admin-side.
  viewer: [
    "View listing",
    "View lead",
    "View viewing request",
    "View valuation request",
  ],
};

export const Authorized = async (
  request: IncomingMessage,
  permission: permission_group,
): Promise<PublicUser> => {
  const user = await AuthToken(request);

  if (!ROLE_PERMISSIONS[user.role].includes(permission))
    throw new MiddlewareError(
      "You do not have permission to perform this action",
      403,
    );

  return user;
};
