"use client"

import * as React from "react"
import { Button } from "../../_components/ui/button"
import { Input, Textarea, Select } from "../../_components/ui/field"
import { FormField, K, SectionHead, Status } from "../../_components/Admin/ui"
import { PageIn, useToast } from "../../_components/Admin/motion"
import { useSettingContext } from "../../_lib/Context/Site Setting"
import { useUserContext } from "../../_lib/Context/User"
import { relativeDate } from "../../_lib/format"
import type { SiteSetting } from "../../_lib/Types/Site Setting"

/** Every field here is genuinely read by the live site — see
 * `useSiteSettings.ts` for the public-facing hooks that consume them.
 * `value` in the backend is a JSONB blob; every key stores it uniformly
 * as `{ value: <string> }`. */
const FIELD_DEFS = {
  phone: {
    key: "contact.phone",
    group: "contact",
    label: "Phone / WhatsApp",
  },
  email: { key: "contact.email", group: "contact", label: "Enquiries email" },
  office_address: {
    key: "contact.office_address",
    group: "contact",
    label: "Office address",
  },
  linkedin: {
    key: "contact.linkedin",
    group: "contact",
    label: "LinkedIn URL",
  },
  instagram: {
    key: "contact.instagram",
    group: "contact",
    label: "Instagram URL",
  },
  unclaimed_assignee: {
    key: "leads.unclaimed_assignee",
    group: "leads",
    label: "Unclaimed enquiries go to",
  },
  reply_sla_value: {
    key: "leads.reply_sla_value",
    group: "leads",
    label: "Reply promised within (value)",
  },
  reply_sla_unit: {
    key: "leads.reply_sla_unit",
    group: "leads",
    label: "Reply promised within (unit)",
  },
} as const

type FieldName = keyof typeof FIELD_DEFS

type Draft = {
  phone: string
  email: string
  office_address: string
  linkedin: string
  instagram: string
  unclaimed_assignee: string
  reply_sla_value: string
  reply_sla_unit: string
}

const DEFAULT_DRAFT: Draft = {
  phone: "254711000003",
  email: "hello@entity.co.ke",
  office_address:
    "2nd floor, Muthithi Road\nWestlands, Nairobi\nVisits by appointment",
  linkedin: "",
  instagram: "",
  unclaimed_assignee: "",
  reply_sla_value: "4",
  reply_sla_unit: "working hours",
}

function readValue(settings: SiteSetting[], key: string): unknown {
  return settings.find((s) => s.key === key)?.value?.value
}

function draftFromSettings(settings: SiteSetting[]): Draft {
  const draft: Record<string, string> = { ...DEFAULT_DRAFT }
  for (const name of Object.keys(FIELD_DEFS) as FieldName[]) {
    const raw = readValue(settings, FIELD_DEFS[name].key)
    if (raw === undefined || raw === null || raw === "") continue
    draft[name] = String(raw)
  }
  return draft as unknown as Draft
}

export default function AdminSiteSettingsPage() {
  const { settings, createSetting, editSetting } = useSettingContext(),
    { users } = useUserContext(),
    push = useToast(),
    [draft, setDraft] = React.useState<Draft>(() =>
      draftFromSettings(settings)
    ),
    [saving, setSaving] = React.useState(false)

  const settingsSnapshot = JSON.stringify(
      settings.map((s) => [s.key, s.value])
    ),
    [lastSnapshot, setLastSnapshot] = React.useState(settingsSnapshot)

  if (settingsSnapshot !== lastSnapshot) {
    setLastSnapshot(settingsSnapshot)
    setDraft(draftFromSettings(settings))
  }

  const baseline = draftFromSettings(settings),
    changedFields = (Object.keys(FIELD_DEFS) as FieldName[]).filter(
      (name) => draft[name] !== baseline[name]
    ),
    isDirty = changedFields.length > 0

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const discard = () => setDraft(baseline)

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all(
        changedFields.map((name) => {
          const def = FIELD_DEFS[name],
            exists = settings.some((s) => s.key === def.key),
            value = { value: draft[name] }

          return exists
            ? editSetting(def.key, { value })
            : createSetting({ key: def.key, value, group_name: def.group })
        })
      )
      push({ title: "Settings saved", body: "Changes are live on the site" })
    } catch (error) {
      push({ title: "Couldn't save", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const recentChanges = [...settings]
    .filter((s) => Object.values(FIELD_DEFS).some((d) => d.key === s.key))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5)

  const labelForKey = (key: string) =>
    Object.values(FIELD_DEFS).find((d) => d.key === key)?.label ?? key

  const nameForUser = (userId: string | null) =>
    (userId && users.find((u) => u.id === userId)?.name) || "Someone"

  return (
    <PageIn>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="min-w-0"
      >
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7">
          <h1 className="m-0 text-[22px] font-normal">Site settings</h1>
          {isDirty ? (
            <Status tone="pending">{changedFields.length} unsaved</Status>
          ) : null}
          <span className="flex-1" />
          <Button
            type="button"
            variant="secondary"
            onClick={discard}
            disabled={!isDirty || saving}
          >
            Discard
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="px-4 md:px-7">
          <SectionHead className="mt-5">Contact</SectionHead>

          <FormField
            label="Phone / WhatsApp"
            hint="Used site-wide whenever no agent's own number applies"
          >
            <Input
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="cl-fig text-[14px]"
              placeholder="254711000003"
            />
            <K className="mt-2 text-neutral-600">
              International format, digits only, no leading &quot;+&quot;.
            </K>
          </FormField>

          <FormField
            label="Enquiries email"
            hint="Fallback shown when no agent's public email applies"
          >
            <Input
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              className="text-[14px]"
            />
          </FormField>

          <FormField label="Office address" hint="Shown on the contact page">
            <Textarea
              value={draft.office_address}
              onChange={(e) => set("office_address", e.target.value)}
              className="min-h-22.5 text-[14px] leading-[1.7]"
            />
            <K className="mt-2 text-neutral-600">
              One line per line break — shown exactly as written.
            </K>
          </FormField>

          <FormField
            label="LinkedIn URL"
            hint="Shown as an icon in the site footer — blank hides it"
          >
            <Input
              value={draft.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              className="text-[14px]"
              placeholder="https://linkedin.com/company/..."
            />
          </FormField>

          <FormField
            label="Instagram URL"
            hint="Shown as an icon in the site footer — blank hides it"
          >
            <Input
              value={draft.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className="text-[14px]"
              placeholder="https://instagram.com/..."
            />
          </FormField>

          <SectionHead className="mt-2">Leads &amp; enquiries</SectionHead>

          <FormField
            label="Unclaimed enquiries go to"
            hint="Shown to staff on the leads queue"
          >
            <Select
              value={draft.unclaimed_assignee}
              onChange={(e) => set("unclaimed_assignee", e.target.value)}
              className="text-[14px]"
            >
              <option value="">The front desk</option>
              {users
                .filter((u) => u.is_active)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
            </Select>
          </FormField>

          <FormField
            label="Reply promised within"
            hint="Drives the overdue flag on the leads queue"
          >
            <div className="flex gap-2.5">
              <Input
                value={draft.reply_sla_value}
                onChange={(e) => set("reply_sla_value", e.target.value)}
                inputMode="numeric"
                className="w-22 text-[14px]"
              />
              <Select
                value={draft.reply_sla_unit}
                onChange={(e) => set("reply_sla_unit", e.target.value)}
                className="flex-1 text-[14px]"
              >
                <option>working hours</option>
                <option>hours</option>
                <option>working days</option>
              </Select>
            </div>
          </FormField>

          <SectionHead className="mt-2">Recently changed</SectionHead>
          <div className="mt-3 flex flex-col gap-3 pb-4">
            {recentChanges.length === 0 ? (
              <div className="text-[13px] text-neutral-600">
                No edits recorded yet.
              </div>
            ) : (
              recentChanges.map((s) => (
                <div key={s.key} className="flex gap-3">
                  <span className="cl-fig cl-k w-19.5 flex-none text-(--color-accent)">
                    {relativeDate(s.updated_at)}
                  </span>
                  <div className="text-[13px] leading-[1.55]">
                    {nameForUser(s.updated_by)} changed{" "}
                    {labelForKey(s.key).toLowerCase()}.
                  </div>
                </div>
              ))
            )}
          </div>

          <K className="mb-6 leading-[1.6] text-neutral-600">
            Only accounts with the admin role can change site settings. Reading
            them (what the public site does) needs no session at all.
          </K>
        </div>
      </form>
    </PageIn>
  )
}
