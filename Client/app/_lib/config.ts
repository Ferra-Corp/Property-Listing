export const ServerUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

/**
 * WhatsApp number for enquiries with no agent assigned (the general
 * contact/valuation forms), or whose agent has no whatsapp_number/phone on
 * file — currently Amina Hassan's, as the designated first point of contact.
 * Update here (or via the env var) if that designation changes.
 * International format, digits only, no leading "+".
 */
export const ADMIN_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER ?? "254711000003"
