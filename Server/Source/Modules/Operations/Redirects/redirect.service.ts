import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createRedirectDTO,
  Redirect,
  RedirectRepository,
  RedirectService,
  UpdateRedirectDTO,
} from "./redirect.types.js";

export class RedirectServ implements RedirectService {
  constructor(
    private repo: RedirectRepository,
    private cache: Cache,
  ) {}

  async createRedirect(details: createRedirectDTO): Promise<Redirect> {
    if (!details)
      throw new ServiceError("Redirect details must be provided", 400);

    const allowedFields: (keyof createRedirectDTO)[] = [
      "from_path",
      "to_path",
    ];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newRedirect = await this.repo.createRedirect(details);

    await this.cache.invalidate(CacheKeys.all(Resource.Redirect));

    return newRedirect;
  }

  async editRedirect(
    id: string,
    details: UpdateRedirectDTO,
  ): Promise<Redirect> {
    if (!id || !details)
      throw new ServiceError("Redirect id and details must be provided", 400);

    const allowedFields: (keyof UpdateRedirectDTO)[] = [
      "from_path",
      "to_path",
      "status_code",
    ];

    let filteredDetails: UpdateRedirectDTO = {};

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedRedirect = await this.repo.editRedirect(id, filteredDetails);

    await this.cache.invalidate(CacheKeys.all(Resource.Redirect));

    return patchedRedirect;
  }

  async getRedirects(): Promise<Redirect[]> {
    return this.cache.remember(CacheKeys.all(Resource.Redirect), () =>
      this.repo.getRedirects(),
    );
  }

  async deleteRedirect(id: string): Promise<void> {
    if (!id) throw new ServiceError("Redirect id must be provided", 404);

    await this.repo.deleteRedirect(id);

    await this.cache.invalidate(CacheKeys.all(Resource.Redirect));
  }
}
