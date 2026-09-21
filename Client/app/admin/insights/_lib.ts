import type { InsightWithTags, ContentStatus } from "../../_lib/Types/Insight"
import type { PublicUser } from "../../_lib/Types/User"
import type { StatusTone } from "../../_components/Admin/ui"

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

export const STATUS_TONE: Record<ContentStatus, StatusTone> = {
  draft: "pending",
  published: "published",
  archived: "outline",
}

export function authorFor(
  insight: InsightWithTags,
  users: PublicUser[]
): PublicUser | null {
  if (!insight.author_id) return null
  return users.find((u) => u.id === insight.author_id) ?? null
}

export function authorLabelFor(
  insight: InsightWithTags,
  users: PublicUser[]
): string {
  if (!insight.author_id) return "No author set"
  const user = authorFor(insight, users)
  return user?.name ?? "—"
}

export function subjectFor(insight: InsightWithTags): string {
  return insight.tags.length > 0
    ? insight.tags.map((t) => t.name).join(", ")
    : "Untagged"
}

export function wordsLabel(insight: InsightWithTags): string {
  return insight.word_count > 0
    ? `${insight.word_count.toLocaleString()} words`
    : "No content yet"
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Counts words in the visible text, ignoring HTML markup — unlike the
 * backend's own count on create, which naively splits the raw HTML string
 * and so counts tags/attributes as words too. Used to keep `word_count`
 * (and the generated `read_minutes` it drives) accurate after an edit,
 * since editing an existing article does not recompute it automatically. */
export function wordCountFromHtml(html: string): number {
  if (typeof document === "undefined") return 0
  const el = document.createElement("div")
  el.innerHTML = html
  const text = el.textContent ?? ""
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
}
