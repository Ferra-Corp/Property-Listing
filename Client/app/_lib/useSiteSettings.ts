"use client"

import { useSettingContext } from "./Context/Site Setting"

// Shown only until each setting is first saved from Site settings. Exported
// so pages outside the settings context (the admin sign-in screens) fall
// back to exactly what the rest of the site does.
export const DEFAULT_CONTACT_PHONE = "254711000003"
export const DEFAULT_CONTACT_EMAIL = "hello@entity.co.ke"
export const DEFAULT_OFFICE_ADDRESS =
  "2nd floor, Muthithi Road\nWestlands, Nairobi\nVisits by appointment"

/** Reads one site-setting key's `{ value }` blob, falling back when the key
 * hasn't been set yet (or hasn't loaded) — so the site always renders
 * something sensible rather than a blank field. */
export function useSiteSettingValue(key: string, fallback: string): string {
  const { settings } = useSettingContext()
  const raw = settings.find((s) => s.key === key)?.value?.value
  return raw == null || raw === "" ? fallback : String(raw)
}

/**
 * The one number used site-wide whenever a lead has no agent assigned, or
 * their assigned agent has no phone/WhatsApp on file — WhatsApp links and
 * `tel:` links both use it. International format, digits only, no leading
 * "+". Editable from Site settings; this default only applies before the
 * setting is ever saved.
 */
export function useContactPhone(): string {
  return useSiteSettingValue("contact.phone", DEFAULT_CONTACT_PHONE)
}

/** Fallback enquiries address shown when no specific agent's own address applies. */
export function useContactEmail(): string {
  return useSiteSettingValue("contact.email", DEFAULT_CONTACT_EMAIL)
}

/** The office address shown on the contact page — one line per `\n`. */
export function useOfficeAddress(): string {
  return useSiteSettingValue("contact.office_address", DEFAULT_OFFICE_ADDRESS)
}

/** Social links shown in the footer — empty string means "not set", so the
 * footer can skip the icon entirely rather than link nowhere. */
export function useSocialLinks(): { linkedin: string; instagram: string } {
  return {
    linkedin: useSiteSettingValue("contact.linkedin", ""),
    instagram: useSiteSettingValue("contact.instagram", ""),
  }
}
