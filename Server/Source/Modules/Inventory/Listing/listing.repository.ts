import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createListingDTO,
  Listing,
  ListingRepository,
  ListingWithMedia,
  ListingWithThumbnail,
  UpdateListingDTO,
} from "./listing.types.js";

export class ListingRepo implements ListingRepository {
  constructor(private db: Database) {}

  async createListing(details: createListingDTO): Promise<Listing> {
    try {
      const fields: Record<string, any> = {
          reference_code: details.reference_code,
          slug: details.slug,
          title: details.title,
          summary: details.summary ?? null,
          description: details.description,
          property_type: details.property_type,
          property_subtype: details.property_subtype ?? null,
          purpose: details.purpose,
          status: details.status ?? "draft",
          country_code: details.country_code ?? "KE",
          state_region: details.state_region ?? null,
          city: details.city ?? null,
          neighbourhood: details.neighbourhood ?? null,
          location_label: details.location_label,
          address_line: details.address_line ?? null,
          postal_code: details.postal_code ?? null,
          latitude: details.latitude ?? null,
          longitude: details.longitude ?? null,
          price: details.price ?? null,
          currency_code: details.currency_code ?? "KES",
          price_period: details.price_period ?? "total",
          price_on_request: details.price_on_request ?? false,
          service_charge: details.service_charge ?? null,
          service_charge_period: details.service_charge_period ?? null,
          bedrooms: details.bedrooms ?? null,
          bathrooms: details.bathrooms ?? null,
          parking_spaces: details.parking_spaces ?? null,
          floor_area: details.floor_area ?? null,
          floor_area_unit: details.floor_area_unit ?? null,
          land_area: details.land_area ?? null,
          land_area_unit: details.land_area_unit ?? null,
          floors: details.floors ?? null,
          year_built: details.year_built ?? null,
          features: JSON.stringify(details.features ?? {}),
          agent_id: details.agent_id,
          created_by: details.created_by ?? null,
          is_exclusive: details.is_exclusive ?? false,
          is_featured: details.is_featured ?? false,
          meta_title: details.meta_title ?? null,
          meta_description: details.meta_description ?? null,
          og_image_url: details.og_image_url ?? null,
          canonical_url: details.canonical_url ?? null,
          noindex: details.noindex ?? false,
          published_at: details.published_at ?? null,
          sold_at: details.sold_at ?? null,
        },
        columns = Object.keys(fields),
        values = Object.values(fields),
        placeholders = columns.map((_, index) => `$${index + 1}`);

      const sqlString: string = `INSERT INTO listings(${columns.join(",")}) VALUES(${placeholders.join(",")}) RETURNING *`,
        sqlQuery = await this.db.query(sqlString, values),
        listingQuery = sqlQuery as QueryResult<Listing>;

      return listingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editListing(id: string, details: UpdateListingDTO): Promise<Listing> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(key === "features" ? JSON.stringify(value) : value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE listings SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        listingQuery = sqlQuery as QueryResult<Listing>;

      return listingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getListing(id: string): Promise<ListingWithMedia | null> {
    try {
      const sqlString: string = `
          SELECT
            l.*,
            COALESCE(
              JSON_AGG(m.* ORDER BY m.sort_order) FILTER (WHERE m.id IS NOT NULL),
              '[]'
            ) AS media
          FROM listings l
          LEFT JOIN listing_media m
            ON m.listing_id = l.id AND m.deleted_at IS NULL
          WHERE l.id = $1 AND l.deleted_at IS NULL
          GROUP BY l.id
        `,
        sqlQuery = await this.db.query(sqlString, [id]),
        listingQuery = sqlQuery as QueryResult<ListingWithMedia>;

      return listingQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getListings(): Promise<ListingWithThumbnail[]> {
    try {
      const sqlString: string = `
          SELECT
            l.*,
            COALESCE(m.thumbnail_url, m.url) AS thumbnail_url
          FROM listings l
          LEFT JOIN listing_media m
            ON m.listing_id = l.id AND m.is_primary = true AND m.deleted_at IS NULL
          WHERE l.deleted_at IS NULL
        `,
        sqlQuery = await this.db.query(sqlString),
        listingsQuery = sqlQuery as QueryResult<ListingWithThumbnail>;

      return listingsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteListing(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE listings SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
