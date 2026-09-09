import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createListingViewDTO,
  ListingView,
  ViewRepository,
} from "./view.types.js";

export class ViewRepo implements ViewRepository {
  constructor(private db: Database) {}

  async createView(details: createListingViewDTO): Promise<ListingView> {
    try {
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

      return viewQuery.rows[0]!;
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
