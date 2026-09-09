import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  attachListingDTO,
  InsightListing,
  InsightListingRepository,
} from "./listing.types.js";

export class InsightListingRepo implements InsightListingRepository {
  constructor(private db: Database) {}

  /** Upsert: attaching an already-linked listing just updates its sort_order. */
  async attachListing(details: attachListingDTO): Promise<InsightListing> {
    try {
      const sqlString: string =
          "INSERT INTO insight_listings(insight_id,listing_id,sort_order) VALUES($1,$2,$3) ON CONFLICT (insight_id,listing_id) DO UPDATE SET sort_order=EXCLUDED.sort_order RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.insight_id,
          details.listing_id,
          details.sort_order ?? 0,
        ]),
        insightListingQuery = sqlQuery as QueryResult<InsightListing>;

      return insightListingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async detachListing(insightId: string, listingId: string): Promise<void> {
    try {
      const sqlString: string =
        "DELETE FROM insight_listings WHERE insight_id=$1 AND listing_id=$2";

      await this.db.query(sqlString, [insightId, listingId]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getListingsForInsight(insightId: string): Promise<InsightListing[]> {
    try {
      const sqlString: string =
          "SELECT * FROM insight_listings WHERE insight_id=$1 ORDER BY sort_order",
        sqlQuery = await this.db.query(sqlString, [insightId]),
        insightListingsQuery = sqlQuery as QueryResult<InsightListing>;

      return insightListingsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
