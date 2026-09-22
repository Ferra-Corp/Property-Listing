"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "../../../_components/ui/button"
import { Input, Select } from "../../../_components/ui/field"
import { PageHead } from "../../../_components/Admin/admin-shell"
import { PlusIcon } from "../../../_components/Admin/icons"
import { K, Status } from "../../../_components/Admin/ui"
import { RowIn } from "../../../_components/Admin/motion"
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

const STATE_FILTERS = ["Active", "Unsubscribed", "All"] as const

export function SubscriberList({ selectedId }: { selectedId?: string }) {
  const { subscribers, createSubscriber, loading } = useSubscriberContext(),
    push = useToast(),
    [stateFilter, setStateFilter] =
      React.useState<(typeof STATE_FILTERS)[number]>("Active"),
    [interestFilter, setInterestFilter] = React.useState<
      SubscriberInterest | ""
    >(""),
    [query, setQuery] = React.useState(""),
    [adding, setAdding] = React.useState(false),
    [newEmail, setNewEmail] = React.useState(""),
    [newInterest, setNewInterest] = React.useState<SubscriberInterest>(
      INTEREST_OPTIONS[0]!
    ),
    [saving, setSaving] = React.useState(false)

  const filtered = subscribers.filter((subscriber) => {
    if (stateFilter === "Active" && !isActive(subscriber)) return false
    if (stateFilter === "Unsubscribed" && isActive(subscriber)) return false
    if (interestFilter && subscriber.interest !== interestFilter) return false
    if (
      query.trim() &&
      !subscriber.email.toLowerCase().includes(query.trim().toLowerCase())
    )
      return false
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const activeCount = subscribers.filter(isActive).length

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await createSubscriber({ email: newEmail.trim(), interest: newInterest })
      push({ title: "Subscriber added", body: newEmail.trim() })
      setNewEmail("")
      setAdding(false)
    } catch (error) {
      push({
        title: "Couldn't add that subscriber",
        body: (error as Error).message,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-w-0 border-r-0 border-(--color-divider) md:border-r">
      <PageHead
        title="Subscribers"
        meta={`${activeCount} active of ${subscribers.length} total`}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => setAdding((v) => !v)}
        >
          <PlusIcon size={14} />
          Add subscriber
        </Button>
      </PageHead>

      {adding ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-2.5 border-b border-(--color-divider) px-4 py-3.5 md:px-6"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <K>Email</K>
            <Input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@example.com"
              className="text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <K>Interest</K>
            <Select
              value={newInterest}
              onChange={(e) =>
                setNewInterest(e.target.value as SubscriberInterest)
              }
              className="w-44 text-[13px]"
            >
              {INTEREST_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INTEREST_LABEL[option]}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Adding…" : "Add"}
          </Button>
        </form>
      ) : null}

      <div className="px-4 pt-3.5 md:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="cl-input w-full text-[13px]"
        />
      </div>

      <div className="scr flex items-center gap-2.5 overflow-x-auto px-4 pt-3.5 md:flex-wrap md:overflow-visible md:px-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="hidden w-56 flex-none text-[13px] md:block"
        />
        <div className="cl-seg flex-none">
          {STATE_FILTERS.map((option) => (
            <label key={option} className="cl-seg-opt">
              <input
                type="radio"
                name="subscriber-state"
                checked={stateFilter === option}
                onChange={() => setStateFilter(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <Select
          value={interestFilter}
          onChange={(e) =>
            setInterestFilter(e.target.value as SubscriberInterest | "")
          }
          className="w-44 flex-none text-[13px]"
        >
          <option value="">Any interest</option>
          {INTEREST_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {INTEREST_LABEL[option]}
            </option>
          ))}
        </Select>
      </div>

      <div className="px-4 pt-3 pb-6 md:px-6">
        {sorted.length === 0 ? (
          <div className="px-1 py-10 text-center text-[13.5px] text-neutral-600">
            {loading ? "Loading…" : "No subscribers match this filter."}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-(--color-divider)">
            {sorted.map((subscriber, index) => (
              <RowIn key={subscriber.id} index={index}>
                <Link
                  href={`/admin/subscribers/${subscriber.id}`}
                  className={[
                    "flex items-center gap-3 py-3 outline-none",
                    selectedId === subscriber.id
                      ? "md:bg-neutral-100"
                      : "hover:md:bg-neutral-50",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px]">
                      {subscriber.email}
                    </div>
                    <K className="mt-0.5">
                      {INTEREST_LABEL[subscriber.interest]} · since{" "}
                      {dateLabel(subscriber.created_at)}
                    </K>
                  </div>
                  <Status
                    tone={
                      isActive(subscriber) ? ACTIVE_TONE : UNSUBSCRIBED_TONE
                    }
                  >
                    {isActive(subscriber) ? "Active" : "Unsubscribed"}
                  </Status>
                </Link>
              </RowIn>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
