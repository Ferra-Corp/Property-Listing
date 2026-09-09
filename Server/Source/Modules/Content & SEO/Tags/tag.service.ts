import { ServiceError } from "../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../Configurations/Cache.js";
import type {
  createTagDTO,
  Tag,
  TagRepository,
  TagService,
  UpdateTagDTO,
} from "./tag.types.js";

const REQUIRED_TAG_FIELDS: (keyof createTagDTO)[] = ["name", "slug"];

const UPDATABLE_TAG_FIELDS: (keyof UpdateTagDTO)[] = ["name", "slug"];

export class TagServ implements TagService {
  constructor(
    private repo: TagRepository,
    private cache: Cache,
  ) {}

  async createTag(details: createTagDTO): Promise<Tag> {
    if (!details) throw new ServiceError("Tag details must be provided", 400);

    for (let key of REQUIRED_TAG_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newTag = await this.repo.createTag(details);

    await this.cache.invalidate(CacheKeys.all(Resource.Tag));

    return newTag;
  }

  async editTag(id: string, details: UpdateTagDTO): Promise<Tag> {
    if (!id || !details)
      throw new ServiceError("Tag id and details must be provided", 400);

    let filteredDetails: UpdateTagDTO = {};

    for (let key of UPDATABLE_TAG_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedTag = await this.repo.editTag(id, filteredDetails);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Tag, id),
      CacheKeys.all(Resource.Tag),
    );

    return patchedTag;
  }

  async getTag(id: string): Promise<Tag> {
    if (!id) throw new ServiceError("Tag id must be provided", 400);

    return this.cache.remember(CacheKeys.single(Resource.Tag, id), async () => {
      const tag = await this.repo.getTag(id);

      if (!tag) throw new ServiceError("Tag not found", 404);

      return tag;
    });
  }

  async getTags(): Promise<Tag[]> {
    return this.cache.remember(CacheKeys.all(Resource.Tag), () =>
      this.repo.getTags(),
    );
  }

  async deleteTag(id: string): Promise<void> {
    if (!id) throw new ServiceError("Tag id must be provided", 404);

    await this.repo.deleteTag(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Tag, id),
      CacheKeys.all(Resource.Tag),
    );
  }
}
