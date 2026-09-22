import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createListingViewDTO,
  ListingView,
  RecordedListingView,
  ViewRepository,
} from "./view.types.js";

// One counted view per visitor per listing per day — session_hash is the
// only thing that lets us recognize the same visitor twice, so a beacon
// with none (cookies blocked) always counts, uncapped.
const DEDUP_WINDOW = "24 hours";

export class ViewRepo implements ViewRepository {
  constructor(private db: Database) {}

  async createView(
    details: createListingViewDTO,
  ): Promise<RecordedListingView> {
    try {
      if (details.session_hash) {
        const existingQuery = await this.db.query(
            `SELECT * FROM listing_views WHERE listing_id=$1 AND session_hash=$2 AND created_at > now() - interval '${DEDUP_WINDOW}' ORDER BY created_at DESC LIMIT 1`,
            [details.listing_id, details.session_hash],
          ),
          existingRow = (existingQuery as QueryResult<ListingView>).rows[0];

        if (existingRow) return { view: existingRow, counted: false };
      }

      const sqlString: string =
          "INSERT INTO listing_views(listing_id,session_hash,country_code,referrer,utm_source,device) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.listing_id,
          details.session_hash ?? null,
          details.country_code ?? null,
          details.referrer ?? null,
          details.utm_source ?? null,
          details.device ?? null,
        ]),
        viewQuery = sqlQuery as QueryResult<ListingView>;

      // The listing_views row is the durable analytics record; this is just
      // the fast-path denormalized counter on listings.view_count kept in
      // step with it (same pattern as insights.view_count).
      await this.db.query(
        "UPDATE listings SET view_count = view_count + 1 WHERE id=$1",
        [details.listing_id],
      );

      return { view: viewQuery.rows[0]!, counted: true };
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getViews(): Promise<ListingView[]> {
    try {
      const sqlString: string = "SELECT * FROM listing_views",
        sqlQuery = await this.db.query(sqlString),
        viewsQuery = sqlQuery as QueryResult<ListingView>;

      return viewsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
