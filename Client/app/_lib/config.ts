export const ServerUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// The fallback contact number used to live here as a build-time constant —
// it's now the real `contact.phone` site setting, editable live from
// /admin/site-settings. See `useContactPhone()` in `useSiteSettings.ts`.
