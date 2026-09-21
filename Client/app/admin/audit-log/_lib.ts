import type { PublicUser } from "../../_lib/Types/User"

export type ActionCategory = "created" | "updated" | "published" | "deleted"

/** Real `action` values are full phrases ("Agent profile creation", "Tag
 * link deletion", "User invite") rather than a fixed enum, so filtering and
 * status tone both work off keyword matching instead of exact equality. */
export function categorize(action: string): ActionCategory {
  const a = action.toLowerCase()
  if (a.includes("delet")) return "deleted"
  if (a.includes("publish")) return "published"
  if (a.includes("creat") || a.includes("invite")) return "created"
  return "updated"
}

export function toneFor(action: string): "pending" | "published" {
  return categorize(action) === "deleted" ? "pending" : "published"
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export function dayLabel(iso: string): string {
  const date = new Date(iso),
    today = new Date(),
    yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const formatted = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  if (isSameDay(date, today)) return `Today · ${formatted}`
  if (isSameDay(date, yesterday)) return `Yesterday · ${formatted}`
  return formatted
}

export function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("")
}

export function userName(
  users: PublicUser[],
  userId: string | null
): string | null {
  if (!userId) return null
  return users.find((u) => u.id === userId)?.name ?? null
}

/** A short, human summary of a changes blob — the log stores the full
 * created/updated record, not a {field: [before, after]} diff, so this
 * just names how many keys are on file rather than fabricating a diff. */
export function changesSummary(changes: Record<string, unknown> | null): string {
  if (!changes) return "No changes recorded"
  const keys = Object.keys(changes)
  return `${keys.length} field${keys.length === 1 ? "" : "s"} on file`
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
