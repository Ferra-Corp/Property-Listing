import redis, { type RedisClientType } from "redis";
import { CACHE_URL } from "./Env.js";
import { ErrorMsg } from "../Source/Utilities/Logger.js";

if (!CACHE_URL) throw new Error("REDIS_URL must be provided in .env");

const REDIS_URL: string = CACHE_URL;

const DEFAULT_TTL_SECONDS = 300;

export const Resource = {
  Currency: "Currency",
  ExchangeRate: "ExchangeRate",
  ListingView: "ListingView",
  Notification: "Notification",
  Redirect: "Redirect",
  SiteSetting: "SiteSetting",
  Listing: "Listing",
  ListingMedia: "ListingMedia",
  User: "User",
  Agent: "Agent",
  Lead: "Lead",
  LeadActivity: "LeadActivity",
  ViewingRequest: "ViewingRequest",
  ValuationRequest: "ValuationRequest",
  Insight: "Insight",
  InsightView: "InsightView",
  InsightListing: "InsightListing",
  Tag: "Tag",
  InsightTag: "InsightTag",
  Service: "Service",
} as const;

export type Resource = (typeof Resource)[keyof typeof Resource];

/** One place to build every cache key, so no resource can typo its own label. */
export const CacheKeys = {
  single: (resource: Resource, id: string): string => `${resource}:${id}`,
  all: (resource: Resource): string => `${resource}:all`,
  scoped: (resource: Resource, parentId: string): string =>
    `${resource}:by:${parentId}`,
};

export class Cache {
  private client: RedisClientType;
  private connecting: Promise<void> | null = null;

  constructor() {
    this.client = redis.createClient({ url: REDIS_URL });
    this.client.on("error", (error) => ErrorMsg(error as Error));
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) return;

    this.connecting ??= this.client
      .connect()
      .then(() => {})
      .finally(() => {
        this.connecting = null;
      });

    await this.connecting;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnected();

      const raw = await this.client.get(key);

      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      // A cache miss due to Redis being unavailable should never fail the request —
      // the caller falls back to the database exactly as if the key were absent.
      ErrorMsg(error as Error);

      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    try {
      await this.ensureConnected();

      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      ErrorMsg(error as Error);
    }
  }

  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      await this.ensureConnected();

      await this.client.del(keys);
    } catch (error) {
      ErrorMsg(error as Error);
    }
  }

  /** Cache-aside: serve the cached value if present, otherwise compute, cache, and return it. */
  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) return cached;

    const fresh = await fetcher();

    await this.set(key, fresh, ttlSeconds);

    return fresh;
  }

  async close(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }
}
