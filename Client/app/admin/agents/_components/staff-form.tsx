"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ButtonLink } from "../../../_components/ui/button"
import { Plate } from "../../../_components/ui/plate"
import { BackIcon } from "../../../_components/Admin/icons"
import { PageHead, Pad } from "../../../_components/Admin/admin-shell"
import { useToast } from "../../../_components/Admin/motion"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useUserContext } from "../../../_lib/Context/User"
import { uploadImage } from "../../../_lib/uploadImage"
import { slugify } from "../../../_lib/format"
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
import { ROLE_LABEL, initialsFor } from "../_lib"
import type { AgentProfile } from "../../../_lib/Types/Agent"
import type { PublicUser, UserRole } from "../../../_lib/Types/User"

type AccountState = {
  name: string
  email: string
  phone: string
  role: UserRole
  account_active: boolean
}

type ProfileState = {
  display_name: string
  slug: string
  title: string
  bio: string
  photo_url: string
  license_number: string
  years_experience: string
  specializations: string
  languages: string
  phone: string
  whatsapp_number: string
  email_public: string
  linkedin_url: string
  instagram_url: string
  meta_title: string
  meta_description: string
  is_active: boolean
}

function accountFrom(user: PublicUser): AccountState {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    account_active: user.is_active,
  }
}

function profileFrom(agent: AgentProfile): ProfileState {
  return {
    display_name: agent.display_name,
    slug: agent.slug,
    title: agent.title ?? "",
    bio: agent.bio ?? "",
    photo_url: agent.photo_url ?? "",
    license_number: agent.license_number ?? "",
    years_experience: agent.years_experience?.toString() ?? "",
    specializations: agent.specializations.join(", "),
    languages: agent.languages.join(", "),
    phone: agent.phone ?? "",
    whatsapp_number: agent.whatsapp_number ?? "",
    email_public: agent.email_public ?? "",
    linkedin_url: agent.linkedin_url ?? "",
    instagram_url: agent.instagram_url ?? "",
    meta_title: agent.meta_title ?? "",
    meta_description: agent.meta_description ?? "",
    is_active: agent.is_active,
  }
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
}

/**
 * Edits the account itself (name, email, phone, role, whether it can sign
 * in) plus — only when this person actually has one — their public agent
 * profile. Role and "has a profile" are independent: changing someone's
 * role to Agent here doesn't create a profile for them (there's no backend
 * action to create one outside the invite flow), it just changes their
 * reach in the admin.
 */
export function StaffForm({
  user,
  agent,
  variant = "admin",
}: {
  user: PublicUser
  agent?: AgentProfile
  /** "self" is the My Profile page — no editing your own role or locking
   * your own account out, since there's no page for someone else to fix
   * that from if you get it wrong. */
  variant?: "admin" | "self"
}) {
  const { editUser, fetchCurrentUser } = useUserContext(),
    { editAgentProfile } = useAgentContext(),
    push = useToast(),
    router = useRouter(),
    isSelf = variant === "self"

  const [account, setAccount] = React.useState<AccountState>(() =>
      accountFrom(user)
    ),
    [profile, setProfile] = React.useState<ProfileState | null>(() =>
      agent ? profileFrom(agent) : null
    ),
    [saving, setSaving] = React.useState(false),
    [uploading, setUploading] = React.useState(false),
    [error, setError] = React.useState<string | null>(null),
    [resettingPassword, setResettingPassword] = React.useState(false),
    [resetSent, setResetSent] = React.useState(false)

  function setAccountField<K extends keyof AccountState>(
    key: K,
    value: AccountState[K]
  ) {
    setAccount((a) => ({ ...a, [key]: value }))
  }

  function setProfileField<K extends keyof ProfileState>(
    key: K,
    value: ProfileState[K]
  ) {
    setProfile((p) => (p ? { ...p, [key]: value } : p))
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file, "agent")
      setProfileField("photo_url", result.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  // Reuses the forgotten-password flow itself rather than an in-place
  // current/new-password form: it's already the one path that verifies a
  // password change by email before letting it take effect, so a second,
  // parallel "change password" endpoint would just be the same guarantee
  // built twice.
  async function handleRequestPasswordReset() {
    setError(null)
    setResettingPassword(true)
    try {
      const resetRequest = await fetch("/admin/api/auth/forgotpass", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        }),
        resetResponse = await resetRequest.json()

      if (!resetRequest.ok) throw new Error(resetResponse.error)

      setResetSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setResettingPassword(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!account.name.trim() || !account.email.trim()) {
      setError("A name and email are required.")
      return
    }
    if (agent && (!profile?.display_name.trim() || !profile?.slug.trim())) {
      setError("A display name and slug are required for their public profile.")
      return
    }

    setSaving(true)
    try {
      await editUser(user.id, {
        name: account.name.trim(),
        email: account.email.trim(),
        phone: account.phone.trim() || null,
        // Role and account-enabled are both admin-only concerns — self
        // editing never touches either.
        ...(isSelf
          ? {}
          : {
              is_active: account.account_active,
              // Only sent when actually changed — changing role needs
              // "Manage user roles", and there's no reason to demand that
              // permission just to save an unrelated field like phone.
              ...(account.role !== user.role ? { role: account.role } : {}),
            }),
      })

      if (isSelf) await fetchCurrentUser()

      let redirectId = user.id

      if (agent && profile) {
        const nextSlug = slugify(profile.slug)

        await editAgentProfile(agent.id, {
          display_name: profile.display_name.trim(),
          slug: nextSlug,
          title: profile.title.trim() || null,
          bio: profile.bio.trim() || null,
          photo_url: profile.photo_url || null,
          license_number: profile.license_number.trim() || null,
          years_experience: profile.years_experience.trim()
            ? Number(profile.years_experience)
            : null,
          specializations: splitList(profile.specializations),
          languages: splitList(profile.languages),
          phone: profile.phone.trim() || null,
          whatsapp_number: profile.whatsapp_number.trim() || null,
          email_public: profile.email_public.trim() || null,
          linkedin_url: profile.linkedin_url.trim() || null,
          instagram_url: profile.instagram_url.trim() || null,
          meta_title: profile.meta_title.trim() || null,
          meta_description: profile.meta_description.trim() || null,
          is_active: profile.is_active,
        })

        redirectId = nextSlug
      }

      push({
        title: "Saved",
        body: (agent ? profile?.display_name : account.name)?.trim(),
      })
      router.push(isSelf ? "/admin/my-profile" : `/admin/agents/${redirectId}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const backHref = isSelf ? "/admin" : `/admin/agents/${agent?.slug ?? user.id}`

  return (
    <>
      <PageHead
        title={
          isSelf
            ? "My profile"
            : `Edit ${agent ? profile?.display_name : account.name}`
        }
        meta={
          isSelf
            ? agent
              ? "Your account details, plus what's shown on your listing pages and the agents directory"
              : "Your account details — you have no public profile"
            : agent
              ? "Account details, plus what's shown on their listing pages and the agents directory"
              : "Account details — this person has no public profile"
        }
      >
        {isSelf ? null : (
          <ButtonLink
            href={backHref}
            variant="secondary"
            size="icon"
            className="h-9 w-9 flex-none"
            aria-label="Back to profile"
          >
            <BackIcon size={16} />
          </ButtonLink>
        )}
      </PageHead>

      <Pad className="cl-shadcn py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                {isSelf
                  ? "What you use to sign in."
                  : "What they use to sign in, and their reach in the admin."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc_name">Full name</Label>
                <Input
                  id="acc_name"
                  value={account.name}
                  onChange={(e) => setAccountField("name", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="acc_email">Email</Label>
                  <Input
                    id="acc_email"
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccountField("email", e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="acc_phone">Phone</Label>
                  <Input
                    id="acc_phone"
                    value={account.phone}
                    onChange={(e) => setAccountField("phone", e.target.value)}
                  />
                </div>
              </div>

              {isSelf ? null : (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="acc_role">Role</Label>
                  <Select
                    value={account.role}
                    onValueChange={(value) =>
                      setAccountField("role", value as UserRole)
                    }
                  >
                    <SelectTrigger id="acc_role" className="w-full">
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
                  {!agent && account.role === "agent" ? (
                    <p className="text-xs text-muted-foreground">
                      Saving this alone won&apos;t give them a public profile —
                      there&apos;s no page for that yet outside a fresh invite.
                    </p>
                  ) : null}
                </div>
              )}

              {isSelf ? null : (
                <label
                  htmlFor="acc_active"
                  className="group/field flex items-center gap-2.5 pt-1"
                >
                  <Checkbox
                    id="acc_active"
                    checked={account.account_active}
                    onCheckedChange={(checked) =>
                      setAccountField("account_active", checked === true)
                    }
                  />
                  <span className="text-sm">Account enabled — can sign in</span>
                </label>
              )}
            </CardContent>
          </Card>

          {isSelf ? (
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Changed the same way a forgotten one is — by email link, not
                  from here directly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resetSent ? (
                  <p className="text-sm">
                    A reset link has been sent to {user.email}. It lasts one
                    hour and works once.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll email a link to {user.email} that lets you set
                      a new one.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-fit"
                      disabled={resettingPassword}
                      onClick={handleRequestPasswordReset}
                    >
                      {resettingPassword
                        ? "Sending…"
                        : "Send password reset email"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {isSelf ? (
            <Card>
              <CardHeader>
                <CardTitle>Two-factor authentication</CardTitle>
                <CardDescription>
                  Asked for at sign-in if you may publish a listing or approve a
                  valuation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.mfa_enabled ? (
                  <p className="text-sm">
                    Two-factor authentication is already configured on this
                    account.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-muted-foreground">
                      Not set up yet — signing in only asks for your password.
                    </p>
                    <ButtonLink
                      href="/admin/auth/pair-authenticator?next=/admin/my-profile"
                      variant="secondary"
                      className="w-fit"
                    >
                      Set up two-factor authentication
                    </ButtonLink>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {agent && profile ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Plate
                      matted={false}
                      src={profile.photo_url || undefined}
                      alt={profile.display_name}
                      className="h-21.5 w-21.5 flex-none rounded-full"
                      label={initialsFor(profile.display_name)}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                      <label className="cl-btn cl-btn-secondary inline-flex w-fit cursor-pointer items-center">
                        {uploading
                          ? "Uploading…"
                          : profile.photo_url
                            ? "Replace photo"
                            : "Upload photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoUpload(file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                      {profile.photo_url ? (
                        <button
                          type="button"
                          onClick={() => setProfileField("photo_url", "")}
                          className="w-fit text-[12.5px] text-(--color-accent-2) underline underline-offset-2"
                        >
                          Remove photo
                        </button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Public profile</CardTitle>
                  <CardDescription>
                    {isSelf
                      ? "Shown on your listing pages and the agents directory."
                      : "Shown on their listing pages and the agents directory."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="display_name">Display name</Label>
                      <Input
                        id="display_name"
                        value={profile.display_name}
                        onChange={(e) =>
                          setProfileField("display_name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={profile.slug}
                        onChange={(e) =>
                          setProfileField("slug", e.target.value)
                        }
                        onBlur={() =>
                          setProfileField("slug", slugify(profile.slug))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={profile.title}
                        onChange={(e) =>
                          setProfileField("title", e.target.value)
                        }
                        placeholder="Senior Agent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="license">License number</Label>
                      <Input
                        id="license"
                        value={profile.license_number}
                        onChange={(e) =>
                          setProfileField("license_number", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfileField("bio", e.target.value)}
                      placeholder="A short introduction shown on their profile"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="specializations">Specializations</Label>
                      <Input
                        id="specializations"
                        value={profile.specializations}
                        onChange={(e) =>
                          setProfileField("specializations", e.target.value)
                        }
                        placeholder="Apartments, Land, Commercial"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="languages">Languages</Label>
                      <Input
                        id="languages"
                        value={profile.languages}
                        onChange={(e) =>
                          setProfileField("languages", e.target.value)
                        }
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
                      value={profile.years_experience}
                      onChange={(e) =>
                        setProfileField("years_experience", e.target.value)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="profile_phone">Public phone</Label>
                      <Input
                        id="profile_phone"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfileField("phone", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={profile.whatsapp_number}
                        onChange={(e) =>
                          setProfileField("whatsapp_number", e.target.value)
                        }
                        placeholder="Leave blank to use the public phone"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email_public">Public email</Label>
                    <Input
                      id="email_public"
                      type="email"
                      value={profile.email_public}
                      onChange={(e) =>
                        setProfileField("email_public", e.target.value)
                      }
                      placeholder="Defaults to none shown"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        value={profile.linkedin_url}
                        onChange={(e) =>
                          setProfileField("linkedin_url", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="instagram">Instagram URL</Label>
                      <Input
                        id="instagram"
                        value={profile.instagram_url}
                        onChange={(e) =>
                          setProfileField("instagram_url", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <label
                    htmlFor="profile_active"
                    className="group/field flex items-center gap-2.5 pt-1"
                  >
                    <Checkbox
                      id="profile_active"
                      checked={profile.is_active}
                      onCheckedChange={(checked) =>
                        setProfileField("is_active", checked === true)
                      }
                    />
                    <span className="text-sm">
                      Profile visible on the public site
                    </span>
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How it will read in search</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="meta_title">Meta title</Label>
                    <Input
                      id="meta_title"
                      value={profile.meta_title}
                      onChange={(e) =>
                        setProfileField("meta_title", e.target.value)
                      }
                      placeholder="Falls back to the name if left blank"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="meta_description">Meta description</Label>
                    <Textarea
                      id="meta_description"
                      value={profile.meta_description}
                      onChange={(e) =>
                        setProfileField("meta_description", e.target.value)
                      }
                      placeholder="Falls back to the bio if left blank"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <ButtonLink href={backHref} variant="ghost">
              Cancel
            </ButtonLink>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Pad>
    </>
  )
}
