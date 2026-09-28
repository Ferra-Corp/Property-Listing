import { currencyService, rateService } from "../Data Objects/DTO.js";
import { ErrorMsg, Info } from "./Logger.js";

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day
const STALE_AFTER_MS = 20 * 60 * 60 * 1000; // treat anything under a day old as fresh enough

async function runRateRefresh(): Promise<void> {
  try {
    const activeCodes = (await currencyService.getCurrencies())
      .filter((currency) => currency.is_active)
      .map((currency) => currency.code);

    const result = await rateService.refreshRates(activeCodes);

    Info(
      `Exchange rates auto-refreshed from ${result.source}: ` +
        `${result.updated.length} updated` +
        (result.skipped.length > 0
          ? `, no rate for ${result.skipped.join(", ")}`
          : ""),
    );
  } catch (error) {
    // A missed refresh isn't fatal — the last good rate stays in place, and
    // the next scheduled attempt (or the admin's own manual button) can
    // still succeed — so this logs rather than taking the process down.
    ErrorMsg(error as Error);
  }
}

async function needsImmediateRefresh(): Promise<boolean> {
  const rates = await rateService.getRates();
  if (rates.length === 0) return true;

  const newest = rates.reduce((latest, rate) =>
    new Date(rate.fetched_at) > new Date(latest.fetched_at) ? rate : latest,
  );

  return Date.now() - new Date(newest.fetched_at).getTime() > STALE_AFTER_MS;
}

/**
 * Keeps exchange rates from silently going stale when nobody happens to
 * click "Refresh from source" — runs once at startup (skipped if the data
 * already on file is under a day old, so `tsx --watch` restarting on every
 * save during development doesn't spam the provider), then every 24 hours
 * for as long as the process stays up. The manual button in the admin still
 * works exactly the same for an on-demand refresh; this just means the
 * site no longer depends on someone remembering to press it.
 */
export function startRateRefreshSchedule(): void {
  needsImmediateRefresh().then((shouldRun) => {
    if (shouldRun) runRateRefresh();
  });

  setInterval(runRateRefresh, REFRESH_INTERVAL_MS);
}
