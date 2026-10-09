import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createTestimonialDTO,
  Testimonial,
  TestimonialRepository,
  TestimonialService,
  UpdateTestimonialDTO,
} from "./testimonial.types.js";

const REQUIRED_TESTIMONIAL_FIELDS: (keyof createTestimonialDTO)[] = [
  "name",
  "quote",
];

const UPDATABLE_TESTIMONIAL_FIELDS: (keyof UpdateTestimonialDTO)[] = [
  "name",
  "quote",
  "rating",
  "company_name",
  "company_profile_image_url",
  "profile_picture",
  "is_active",
];

// Fields where an explicit null is a real instruction ("clear this"), not
// "leave it alone".
const NULLABLE_TESTIMONIAL_FIELDS: (keyof UpdateTestimonialDTO)[] = [
  "company_name",
  "company_profile_image_url",
  "profile_picture",
];

function validateRating(rating: unknown): void {
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  )
    throw new ServiceError("rating must be a whole number from 1 to 5", 400);
}

export class TestimonialServ implements TestimonialService {
  constructor(
    private repo: TestimonialRepository,
    private cache: Cache,
  ) {}

  private invalidate(id?: string) {
    const all = CacheKeys.all(Resource.Testimonial),
      keys = [all, `${all}:public`];

    if (id) {
      const single = CacheKeys.single(Resource.Testimonial, id);
      keys.push(single, `${single}:public`);
    }

    return this.cache.invalidate(...keys);
  }

  async createTestimonial(details: createTestimonialDTO): Promise<Testimonial> {
    if (!details)
      throw new ServiceError("Testimonial details must be provided", 400);

    for (let key of REQUIRED_TESTIMONIAL_FIELDS) {
      const value = details[key];

      if (typeof value !== "string" || !value.trim())
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    if (details.rating !== undefined) validateRating(details.rating);

    const newTestimonial = await this.repo.createTestimonial(details);

    await this.invalidate();

    return newTestimonial;
  }

  async editTestimonial(
    id: string,
    details: UpdateTestimonialDTO,
  ): Promise<Testimonial> {
    if (!id || !details)
      throw new ServiceError("Testimonial id and details must be provided", 400);

    let filteredDetails: UpdateTestimonialDTO = {};

    for (let key of UPDATABLE_TESTIMONIAL_FIELDS) {
      const value = details[key];

      if (value === undefined) continue;
      if (value === null && !NULLABLE_TESTIMONIAL_FIELDS.includes(key)) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    if (filteredDetails.rating !== undefined)
      validateRating(filteredDetails.rating);

    for (let key of REQUIRED_TESTIMONIAL_FIELDS) {
      const value = filteredDetails[key];

      if (value !== undefined && (typeof value !== "string" || !value.trim()))
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const patchedTestimonial = await this.repo.editTestimonial(
      id,
      filteredDetails,
    );

    if (!patchedTestimonial)
      throw new ServiceError("Testimonial not found", 404);

    await this.invalidate(id);

    return patchedTestimonial;
  }

  async getTestimonial(id: string, publicOnly = false): Promise<Testimonial> {
    if (!id) throw new ServiceError("Testimonial id must be provided", 400);

    const cacheKey = publicOnly
      ? `${CacheKeys.single(Resource.Testimonial, id)}:public`
      : CacheKeys.single(Resource.Testimonial, id);

    return this.cache.remember(cacheKey, async () => {
      const testimonial = await this.repo.getTestimonial(id, publicOnly);

      if (!testimonial) throw new ServiceError("Testimonial not found", 404);

      return testimonial;
    });
  }

  async getTestimonials(publicOnly = false): Promise<Testimonial[]> {
    const cacheKey = publicOnly
      ? `${CacheKeys.all(Resource.Testimonial)}:public`
      : CacheKeys.all(Resource.Testimonial);

    return this.cache.remember(cacheKey, () =>
      this.repo.getTestimonials(publicOnly),
    );
  }

  async deleteTestimonial(id: string): Promise<void> {
    if (!id) throw new ServiceError("Testimonial id must be provided", 404);

    await this.repo.deleteTestimonial(id);

    await this.invalidate(id);
  }
}
