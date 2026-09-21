"use client"

import { useSettingContext } from "./Context/Site Setting"

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
  return useSiteSettingValue("contact.phone", "254711000003")
}

/** Fallback enquiries address shown when no specific agent's own address applies. */
export function useContactEmail(): string {
  return useSiteSettingValue("contact.email", "hello@entity.co.ke")
}

/** The office address shown on the contact page — one line per `\n`. */
export function useOfficeAddress(): string {
  return useSiteSettingValue(
    "contact.office_address",
    "2nd floor, Muthithi Road\nWestlands, Nairobi\nVisits by appointment"
  )
}

/** Social links shown in the footer — empty string means "not set", so the
 * footer can skip the icon entirely rather than link nowhere. */
export function useSocialLinks(): { linkedin: string; instagram: string } {
  return {
    linkedin: useSiteSettingValue("contact.linkedin", ""),
    instagram: useSiteSettingValue("contact.instagram", ""),
  }
}
