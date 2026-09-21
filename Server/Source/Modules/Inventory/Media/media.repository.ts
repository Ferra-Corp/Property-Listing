import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createListingMediaDTO,
  ListingMedia,
  MediaRepository,
  UpdateListingMediaDTO,
} from "./media.types.js";

export class MediaRepo implements MediaRepository {
  constructor(private db: Database) {}

  async createMedia(details: createListingMediaDTO): Promise<ListingMedia> {
    try {
      const sqlString: string =
          "INSERT INTO listing_media(listing_id,type,url,thumbnail_url,watermarked_url,provider,provider_public_id,alt_text,caption,width,height,bytes,duration_seconds,is_primary,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.listing_id,
          details.type ?? "image",
          details.url,
          details.thumbnail_url ?? null,
          details.watermarked_url ?? null,
          details.provider ?? "cloudinary",
          details.provider_public_id ?? null,
          details.alt_text ?? null,
          details.caption ?? null,
          details.width ?? null,
          details.height ?? null,
          details.bytes ?? null,
          (details.duration_seconds
            ? Math.floor(details.duration_seconds)
            : details.duration_seconds) ?? null,
          details.is_primary ?? false,
          details.sort_order ?? 0,
        ]),
        mediaQuery = sqlQuery as QueryResult<ListingMedia>;

      return mediaQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editMedia(
    id: string,
    details: UpdateListingMediaDTO,
  ): Promise<ListingMedia> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      const sqlString: string = `UPDATE listing_media SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        mediaQuery = sqlQuery as QueryResult<ListingMedia>;

      return mediaQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getMedia(): Promise<ListingMedia[]> {
    try {
      const sqlString: string =
          "SELECT * FROM listing_media WHERE deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString),
        mediaQuery = sqlQuery as QueryResult<ListingMedia>;

      return mediaQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteMedia(id: string): Promise<string | null> {
    try {
      const sqlString: string =
          "UPDATE listing_media SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING listing_id",
        sqlQuery = await this.db.query(sqlString, [id]),
        mediaQuery = sqlQuery as QueryResult<{ listing_id: string }>;

      return mediaQuery.rows[0]?.listing_id ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
