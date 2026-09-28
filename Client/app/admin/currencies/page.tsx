"use client"

import * as React from "react"
import { Button } from "../../_components/ui/button"
import { Input } from "../../_components/ui/field"
import {
  Banner,
  K,
  SectionHead,
  Status,
  Td,
  Th,
  Tr,
} from "../../_components/Admin/ui"
import { PageIn, useToast } from "../../_components/Admin/motion"
import { useCurrencyContext } from "../../_lib/Context/Currencies"
import { useRatesContext } from "../../_lib/Context/ExchangeRate"
import { usePermission } from "../../_lib/permissions"
import { relativeDate } from "../../_lib/format"
import type { ExchangeRate } from "../../_lib/Types/ExchangeRate"
import {
  BASE_CURRENCY,
  latestRateFor,
  MAX_ADDITIONAL_CURRENCIES,
  mergeCurrencyRows,
  type CuratedCurrency,
  type CurrencyRow,
} from "./_lib"

/** One rate row — its own local draft so editing one currency's rate by
 * hand doesn't touch any other row's state. */
function RateRow({
  currency,
  rate,
  canEdit,
  onSave,
}: {
  currency: CuratedCurrency
  rate: ExchangeRate | null
  canEdit: boolean
  onSave: (value: number) => Promise<void>
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(String(rate?.rate ?? ""))
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!editing) setDraft(String(rate?.rate ?? ""))
  }, [rate?.rate, editing])

  async function save() {
    const value = Number(draft)
    if (!Number.isFinite(value) || value <= 0) return

    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-2">
          <span className="cl-fig">{currency.code}</span>
          <K className="truncate">{currency.name}</K>
        </div>
      </Td>
      <Td>
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            inputMode="decimal"
            className="cl-fig h-8 w-32 text-[13px]"
            placeholder="0.00000000"
          />
        ) : (
          <span className="cl-fig">
            {rate
              ? Number(rate.rate)
                  .toFixed(8)
                  .replace(/0+$/, "")
                  .replace(/\.$/, "")
              : "—"}
          </span>
        )}
      </Td>
      <Td className="text-neutral-600">{rate?.source ?? "—"}</Td>
      <Td className="text-neutral-600">
        {rate ? relativeDate(rate.fetched_at) : "Never fetched"}
      </Td>
      <Td>
        {!canEdit ? null : editing ? (
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="primary"
              className="h-7 px-2.5 text-[12px]"
              disabled={saving}
              onClick={save}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-7 px-2.5 text-[12px]"
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setDraft(String(rate?.rate ?? ""))
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="h-7 px-2.5 text-[12px]"
            onClick={() => setEditing(true)}
          >
            {rate ? "Edit" : "Set rate"}
          </Button>
        )}
      </Td>
    </Tr>
  )
}

export default function AdminCurrenciesPage() {
  const { currencies, createCurrency, editCurrency } = useCurrencyContext(),
    { rates, createRate, editRate, refreshRates } = useRatesContext(),
    canEdit = usePermission("Edit currency"),
    push = useToast(),
    [pendingCode, setPendingCode] = React.useState<string | null>(null),
    [refreshing, setRefreshing] = React.useState(false)

  const activeAdditionalCount = currencies.filter(
    (c) => c.is_active && c.code !== BASE_CURRENCY
  ).length

  const rows = React.useMemo(() => mergeCurrencyRows(currencies), [currencies])

  const activeNonBase = currencies
    .filter((c) => c.is_active && c.code !== BASE_CURRENCY)
    .sort((a, b) => a.code.localeCompare(b.code))

  async function toggleActive(
    curated: CuratedCurrency,
    saved: CurrencyRow["saved"],
    nextActive: boolean
  ) {
    setPendingCode(curated.code)
    try {
      if (saved) {
        await editCurrency(curated.code, { is_active: nextActive })
      } else {
        await createCurrency({
          ...curated,
          is_active: nextActive,
          sort_order: currencies.length,
        })
      }
      push({
        title: nextActive
          ? `${curated.code} is now shown on the site`
          : `${curated.code} is now hidden from the site`,
      })

      // Newly shown currencies start with no rate on file — fetch one
      // straight away rather than leaving it on "Never fetched" until
      // someone happens to hit "Refresh from source". If this fails (the
      // provider's down, or it just doesn't carry this code) the currency
      // is still active; "Set rate" in the table below still works as the
      // manual fallback either way.
      if (nextActive) {
        try {
          await refreshRates()
        } catch {
          push({
            title: `Couldn't fetch a starting rate for ${curated.code}`,
            body: "Set it manually below, or try Refresh from source again.",
          })
        }
      }
    } catch (error) {
      push({
        title: "Couldn't update that currency",
        body: (error as Error).message,
      })
    } finally {
      setPendingCode(null)
    }
  }

  async function saveManualRate(code: string, value: number) {
    const existing = latestRateFor(rates, code)
    try {
      if (existing) {
        await editRate(existing.id, { rate: value, source: "Manual entry" })
      } else {
        await createRate({
          base_currency: BASE_CURRENCY,
          target_currency: code,
          rate: value,
          source: "Manual entry",
          rate_date: new Date().toISOString().slice(0, 10),
        })
      }
      push({ title: `Rate for ${code} saved` })
    } catch (error) {
      push({
        title: "Couldn't save that rate",
        body: (error as Error).message,
      })
      throw error
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const result = await refreshRates()
      push({
        title: `Rates refreshed from ${result.source}`,
        body:
          result.skipped.length > 0
            ? `${result.updated.length} updated · no rate returned for ${result.skipped.join(", ")}`
            : `${result.updated.length} currencies updated`,
      })
    } catch (error) {
      push({
        title: "Couldn't refresh rates",
        body: (error as Error).message,
      })
    } finally {
      setRefreshing(false)
    }
  }

  const lastRefreshed =
    rates.length > 0
      ? rates.reduce((newest, r) =>
          new Date(r.fetched_at) > new Date(newest.fetched_at) ? r : newest
        )
      : null

  // The server refreshes rates on its own once a day — this is the second
  // line of defence for when that's somehow missed (a restart at the wrong
  // moment, the provider being down that day, ...), so it only fires once
  // a full cycle has plainly been skipped, not on ordinary timing jitter.
  const STALE_AFTER_MS = 36 * 60 * 60 * 1000
  const isStale =
    activeNonBase.length > 0 &&
    (!lastRefreshed ||
      Date.now() - new Date(lastRefreshed.fetched_at).getTime() >
        STALE_AFTER_MS)

  return (
    <PageIn>
      <div className="min-w-0">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3.5 border-b border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-4 py-4 backdrop-blur-sm md:px-7 md:py-4.5">
          <div className="min-w-0">
            <h1 className="m-0 text-[24px] font-normal md:text-[26px]">
              Currency &amp; rates
            </h1>
            <div className="cl-k mt-1.5 text-neutral-600">
              KES always included · {activeAdditionalCount} of{" "}
              {MAX_ADDITIONAL_CURRENCIES} additional selected
            </div>
          </div>
        </div>

        <div className="px-4 pb-10 md:px-7">
          <SectionHead className="mt-5">
            Currencies shown on the site
          </SectionHead>
          <K className="mt-3 block leading-[1.6] text-neutral-600">
            Every listing price is stored in KES and can be shown to a visitor
            in any currency checked below — the site header's switcher offers
            exactly this list. KES itself is always included; pick up to{" "}
            {MAX_ADDITIONAL_CURRENCIES} others.
          </K>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-135 border-collapse">
              <thead>
                <tr>
                  <Th className="w-10"></Th>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Symbol</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ curated, saved }) => {
                  const isBase = curated.code === BASE_CURRENCY
                  const isActive = isBase || saved?.is_active === true
                  const atCap =
                    !isActive &&
                    activeAdditionalCount >= MAX_ADDITIONAL_CURRENCIES
                  const disabled =
                    isBase || !canEdit || atCap || pendingCode === curated.code

                  return (
                    <Tr key={curated.code}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={isActive}
                          disabled={disabled}
                          onChange={(e) =>
                            toggleActive(curated, saved, e.target.checked)
                          }
                          aria-label={`Show ${curated.name} on the site`}
                          className="h-3.5 w-3.5 cursor-pointer accent-(--color-text) disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </Td>
                      <Td className="cl-fig">{curated.code}</Td>
                      <Td>{curated.name}</Td>
                      <Td className="cl-fig">{curated.symbol}</Td>
                      <Td>
                        {isBase ? (
                          <Status tone="mark">Always included</Status>
                        ) : isActive ? (
                          <Status tone="published">Shown</Status>
                        ) : (
                          <Status tone="neutral">Hidden</Status>
                        )}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <SectionHead className="mt-8">Exchange rates</SectionHead>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <K className="flex-1 leading-[1.6] text-neutral-600">
              Rates convert a KES listing price into a visitor's chosen
              currency. The server pulls a fresh rate for every currency above
              from <span className="text-(--color-text)">open.er-api.com</span>{" "}
              — a free, keyless provider — once a day on its own; use the button
              for an on-demand update instead of waiting on that.
            </K>
            {canEdit ? (
              <Button
                type="button"
                variant="primary"
                disabled={refreshing || activeNonBase.length === 0}
                onClick={handleRefresh}
              >
                {refreshing ? "Refreshing…" : "Refresh from source"}
              </Button>
            ) : null}
          </div>
          {lastRefreshed ? (
            <K className="mt-2 block text-neutral-600">
              Last fetched {relativeDate(lastRefreshed.fetched_at)}
            </K>
          ) : null}

          {isStale ? (
            <div className="mt-4">
              <Banner
                kicker="Rates look out of date"
                tone="warn"
                action={
                  canEdit ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={refreshing}
                      onClick={handleRefresh}
                    >
                      {refreshing ? "Refreshing…" : "Refresh now"}
                    </Button>
                  ) : undefined
                }
              >
                {lastRefreshed
                  ? `The daily automatic refresh seems to have missed a cycle — last one was ${relativeDate(lastRefreshed.fetched_at)}. Listing prices shown in another currency may be off until this runs again.`
                  : "No rate has ever been fetched for these currencies — listing prices shown in another currency will fall back to their original value until one is."}
              </Banner>
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-135 border-collapse">
              <thead>
                <tr>
                  <Th>Currency</Th>
                  <Th>1 KES =</Th>
                  <Th>Source</Th>
                  <Th>Fetched</Th>
                  <Th className="w-10"></Th>
                </tr>
              </thead>
              <tbody>
                {activeNonBase.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-neutral-600 italic">
                      No additional currencies are active yet — check one above
                      to see its rate here.
                    </Td>
                  </tr>
                ) : (
                  activeNonBase.map((currency) => (
                    <RateRow
                      key={currency.code}
                      currency={currency}
                      rate={latestRateFor(rates, currency.code)}
                      canEdit={canEdit}
                      onSave={(value) => saveManualRate(currency.code, value)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <K className="mt-6 block leading-[1.6] text-neutral-600">
            Only accounts with the admin role can change currencies or rates.
            Reading them (what the public site does to convert a price) needs no
            session at all.
          </K>
        </div>
      </div>
    </PageIn>
  )
}
