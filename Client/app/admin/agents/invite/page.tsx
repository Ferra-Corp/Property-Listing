"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ButtonLink } from "../../../_components/ui/button"
import { BackIcon } from "../../../_components/Admin/icons"
import { PageIn, useToast } from "../../../_components/Admin/motion"
import { PageHead, Pad } from "../../../_components/Admin/admin-shell"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useUserContext } from "../../../_lib/Context/User"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { Checkbox } from "../../../../components/ui/checkbox"
import { Separator } from "../../../../components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card"
import type { AgentProfile } from "../../../_lib/Types/Agent"
import type { UserRole } from "../../../_lib/Types/User"

type FormState = {
  name: string
  email: string
  phone: string
  role: UserRole
  title: string
  bio: string
  license_number: string
  years_experience: string
  specializations: string
  languages: string
  public_phone: string
  whatsapp_number: string
  email_public: string
  linkedin_url: string
  instagram_url: string
  is_active: boolean
}

const ROLE_LABEL: Record<UserRole, string> = {
  agent: "Agent",
  editor: "Editor",
  admin: "Admin",
  viewer: "Viewer",
}

const ROLE_HINT: Record<UserRole, string> = {
  agent:
    "Reaches the admin and gets a public profile listings can be assigned to.",
  editor:
    "Reaches the admin to manage insights, services and tags — no public profile.",
  admin:
    "Full reach across the admin, including inviting and managing other staff.",
  viewer: "Read-only reach across the admin — no public profile.",
}

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "agent",
  title: "",
  bio: "",
  license_number: "",
  years_experience: "",
  specializations: "",
  languages: "",
  public_phone: "",
  whatsapp_number: "",
  email_public: "",
  linkedin_url: "",
  instagram_url: "",
  is_active: true,
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
}

export default function InviteAgentPage() {
  const router = useRouter(),
    push = useToast(),
    { editAgentProfile } = useAgentContext(),
    { fetchUsers } = useUserContext(),
    [form, setForm] = React.useState<FormState>(INITIAL),
    [submitting, setSubmitting] = React.useState(false),
    [error, setError] = React.useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.email.trim()) {
      setError("A name and email are required to send the invite.")
      return
    }

    setSubmitting(true)
    let createdUserId: string | null = null

    try {
      const createRequest = await fetch("/system/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            role: form.role,
          }),
        }),
        createResponse = await createRequest.json()

      if (!createRequest.ok)
        throw new Error(createResponse.error ?? "Couldn't create the account.")

      createdUserId = createResponse.id as string

      // Only an "agent" role gets a public profile created for it (see
      // user.controller.ts) — for every other role there's nothing further
      // to fill in here.
      if (form.role !== "agent") {
        await fetchUsers()
        push({
          title: "Invite sent",
          body: `${form.name.trim()} · ${ROLE_LABEL[form.role]}`,
        })
        router.push("/admin/agents")
        return
      }

      const agentsRequest = await fetch("/system/api/v1/agents", {
          method: "GET",
        }),
        agentsResponse = await agentsRequest.json()

      if (!agentsRequest.ok)
        throw new Error(
          "The account was created and invited, but the new profile couldn't be found. Finish it from the Staff register."
        )

      const newProfile = (agentsResponse as AgentProfile[]).find(
        (a) => a.user_id === createdUserId
      )

      if (!newProfile)
        throw new Error(
          "The account was created and invited, but the new profile couldn't be found. Finish it from the Staff register."
        )

      await editAgentProfile(newProfile.id, {
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
        license_number: form.license_number.trim() || null,
        years_experience: form.years_experience.trim()
          ? Number(form.years_experience)
          : null,
        specializations: splitList(form.specializations),
        languages: splitList(form.languages),
        phone: form.public_phone.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        email_public: form.email_public.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        is_active: form.is_active,
      })

      await fetchUsers()

      push({ title: "Agent invited", body: form.name.trim() })
      router.push(`/admin/agents/${newProfile.slug}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageIn>
      <PageHead
        title="Invite staff"
        meta="Creates their account and sends the password-setup email — an agent also gets a public profile"
      >
        <ButtonLink
          href="/admin/agents"
          variant="secondary"
          size="icon"
          className="h-9 w-9 flex-none"
          aria-label="Back to staff"
        >
          <BackIcon size={16} />
        </ButtonLink>
      </PageHead>

      <Pad className="cl-shadcn py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                What they&apos;ll use to sign in. The invite email goes to this
                address.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Sarah Kamau"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="sarah@firm.co.ke"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+254 7..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => set("role", value as UserRole)}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_HINT[form.role]}
                </p>
              </div>
            </CardContent>
          </Card>

          {form.role === "agent" ? (
            <Card>
              <CardHeader>
                <CardTitle>Public profile</CardTitle>
                <CardDescription>
                  Shown on their listing pages and the agents directory. Can be
                  filled in later too.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="Senior Agent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="license">License number</Label>
                    <Input
                      id="license"
                      value={form.license_number}
                      onChange={(e) => set("license_number", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="A short introduction shown on their profile"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="specializations">Specializations</Label>
                    <Input
                      id="specializations"
                      value={form.specializations}
                      onChange={(e) => set("specializations", e.target.value)}
                      placeholder="Apartments, Land, Commercial"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="languages">Languages</Label>
                    <Input
                      id="languages"
                      value={form.languages}
                      onChange={(e) => set("languages", e.target.value)}
                      placeholder="English, Swahili"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="years">Years of experience</Label>
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    className="max-w-35"
                    value={form.years_experience}
                    onChange={(e) => set("years_experience", e.target.value)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="public_phone">Public phone</Label>
                    <Input
                      id="public_phone"
                      value={form.public_phone}
                      onChange={(e) => set("public_phone", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={form.whatsapp_number}
                      onChange={(e) => set("whatsapp_number", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email_public">Public email</Label>
                  <Input
                    id="email_public"
                    type="email"
                    value={form.email_public}
                    onChange={(e) => set("email_public", e.target.value)}
                    placeholder="Defaults to none shown"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      value={form.linkedin_url}
                      onChange={(e) => set("linkedin_url", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="instagram">Instagram URL</Label>
                    <Input
                      id="instagram"
                      value={form.instagram_url}
                      onChange={(e) => set("instagram_url", e.target.value)}
                    />
                  </div>
                </div>

                <label
                  htmlFor="is_active"
                  className="group/field flex items-center gap-2.5 pt-1"
                >
                  <Checkbox
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) =>
                      set("is_active", checked === true)
                    }
                  />
                  <span className="text-sm">
                    Publish immediately (visible on the public site)
                  </span>
                </label>
              </CardContent>
            </Card>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <ButtonLink href="/admin/agents" variant="ghost">
              Cancel
            </ButtonLink>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending invite…" : "Send invite"}
            </Button>
          </div>
        </form>
      </Pad>
    </PageIn>
  )
}
