"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../_components/ui/button"
import { Select } from "../../../_components/ui/field"
import { FormField, K, Status } from "../../../_components/Admin/ui"
import { useToast } from "../../../_components/Admin/motion"
import { useSubscriberContext } from "../../../_lib/Context/Subscriber"
import type { SubscriberInterest } from "../../../_lib/Types/Subscriber"
import {
  ACTIVE_TONE,
  dateLabel,
  INTEREST_LABEL,
  INTEREST_OPTIONS,
  isActive,
  UNSUBSCRIBED_TONE,
} from "../_lib"

export function SubscriberPanel({ id }: { id: string }) {
  const { subscribers, editSubscriber, deleteSubscriber, loading } =
      useSubscriberContext(),
    push = useToast(),
    router = useRouter()

  const subscriber = subscribers.find((s) => s.id === id)

  const [interest, setInterest] = React.useState<SubscriberInterest | null>(
      null
    ),
    [lastId, setLastId] = React.useState<string | null>(null),
    [saving, setSaving] = React.useState(false),
    [deleting, setDeleting] = React.useState(false)

  if (subscriber && subscriber.id !== lastId) {
    setLastId(subscriber.id)
    setInterest(subscriber.interest)
  }

  if (!subscriber) {
    return (
      <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-5.5">
        {loading ? "Loading…" : "Subscriber not found."}
      </div>
    )
  }

  async function handleSaveInterest() {
    if (!interest || interest === subscriber!.interest) return
    setSaving(true)
    try {
      await editSubscriber(subscriber!.id, { interest })
      push({ title: "Interest updated" })
    } catch (error) {
      push({
        title: "Couldn't update interest",
        body: (error as Error).message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleSubscribed() {
    setSaving(true)
    try {
      await editSubscriber(subscriber!.id, {
        unsubscribed: isActive(subscriber!),
      })
      push({
        title: isActive(subscriber!) ? "Unsubscribed" : "Resubscribed",
        body: subscriber!.email,
      })
    } catch (error) {
      push({ title: "Couldn't update that", body: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Remove ${subscriber!.email} entirely? This can't be undone.`
      )
    )
      return

    setDeleting(true)
    try {
      await deleteSubscriber(subscriber!.id)
      push({ title: "Subscriber removed", body: subscriber!.email })
      router.push("/admin/subscribers")
    } catch (error) {
      push({
        title: "Couldn't remove that subscriber",
        body: (error as Error).message,
      })
      setDeleting(false)
    }
  }

  return (
    <div className="px-4 py-5 md:px-5.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[16px]">{subscriber.email}</div>
          <K className="mt-1">Subscribed {dateLabel(subscriber.created_at)}</K>
        </div>
        <Status tone={isActive(subscriber) ? ACTIVE_TONE : UNSUBSCRIBED_TONE}>
          {isActive(subscriber) ? "Active" : "Unsubscribed"}
        </Status>
      </div>

      <div className="mt-5">
        <FormField
          label="Interest"
          hint="What kind of listing they hear about."
        >
          <div className="flex items-center gap-2.5">
            <Select
              value={interest ?? subscriber.interest}
              onChange={(e) =>
                setInterest(e.target.value as SubscriberInterest)
              }
              className="w-full text-[13px]"
            >
              {INTEREST_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INTEREST_LABEL[option]}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              disabled={saving || interest === subscriber.interest}
              onClick={handleSaveInterest}
            >
              Save
            </Button>
          </div>
        </FormField>

        <FormField
          label={isActive(subscriber) ? "Unsubscribe" : "Resubscribe"}
          hint={
            isActive(subscriber)
              ? "Stops all future listing alerts to this address."
              : "Starts sending listing alerts to this address again."
          }
        >
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={handleToggleSubscribed}
          >
            {isActive(subscriber) ? "Unsubscribe" : "Resubscribe"}
          </Button>
        </FormField>

        <FormField
          label="Remove"
          hint="Deletes the subscriber and their Resend contact entirely."
        >
          <Button
            type="button"
            variant="secondary"
            className="text-[var(--color-accent-2)]"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Removing…" : "Remove subscriber"}
          </Button>
        </FormField>
      </div>
    </div>
  )
}
