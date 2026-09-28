/**
 * Haptic feedback — SSR-safe. Called from any user gesture.
 *
 * Android + most Chromium mobile: uses `navigator.vibrate` with tuned
 * short patterns per kind. Fires only inside a user gesture.
 *
 * iOS Safari has no Vibration API. In iOS 18+ Safari, clicking a <label>
 * bound to a hidden `<input type="checkbox" switch>` triggers the system
 * haptic. Callers should mount HapticsProvider once at the app root; the
 * provider registers a click function on `window.__dgHaptic` that we can
 * invoke from here without a React import.
 *
 * Everything is behind a `localStorage['dg:haptics']` flag (default 'on').
 * Failures are swallowed: no console noise on desktop, no throws.
 */

export type HapticKind = "light" | "selection" | "success" | "error"

const STORAGE_KEY = "dg:haptics"

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  selection: 8,
  success: [10, 40, 10],
  error: [30, 40, 30],
}

declare global {
  interface Window {
    __dgHaptic?: () => void
  }
}

function isEnabled(): boolean {
  try {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    return true
  }
}

export function haptic(kind: HapticKind): void {
  try {
    if (typeof window === "undefined") return
    if (!isEnabled()) return

    // Android / Chromium mobile: real Vibration API.
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(PATTERNS[kind])
      return
    }

    // iOS Safari fallback — HapticsProvider mounts a hidden switch and
    // registers a trigger on window. Must be called synchronously from
    // inside the originating user gesture.
    if (typeof window.__dgHaptic === "function") {
      window.__dgHaptic()
    }
  } catch {
    // Silent — this must never break the UI.
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
  } catch {
    // ignore
  }
}

export function getHapticsEnabled(): boolean {
  return isEnabled()
}
