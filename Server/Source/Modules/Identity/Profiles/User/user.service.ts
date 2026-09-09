import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  createUserDTO,
  PublicUser,
  UpdateUserDTO,
  UserRepository,
  UserService,
} from "./user.types.js";

const REQUIRED_USER_FIELDS: (keyof createUserDTO)[] = [
  "name",
  "email",
  "password_hash",
];

const UPDATABLE_USER_FIELDS: (keyof UpdateUserDTO)[] = [
  "name",
  "email",
  "phone",
  "whatsapp_number",
  "role",
  "is_active",
];

export class UserServ implements UserService {
  constructor(
    private repo: UserRepository,
    private cache: Cache,
  ) {}

  async createUser(details: createUserDTO): Promise<PublicUser> {
    if (!details) throw new ServiceError("User details must be provided", 400);

    for (let key of REQUIRED_USER_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newUser = await this.repo.createUser(details);

    await this.cache.invalidate(CacheKeys.all(Resource.User));

    return newUser;
  }

  async editUser(id: string, details: UpdateUserDTO): Promise<PublicUser> {
    if (!id || !details)
      throw new ServiceError("User id and details must be provided", 400);

    let filteredDetails: UpdateUserDTO = {};

    for (let key of UPDATABLE_USER_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedUser = await this.repo.editUser(id, filteredDetails);

    await this.cache.invalidate(
      CacheKeys.single(Resource.User, id),
      CacheKeys.all(Resource.User),
    );

    return patchedUser;
  }

  async getUser(id: string): Promise<PublicUser> {
    if (!id) throw new ServiceError("User id must be provided", 400);

    return this.cache.remember(
      CacheKeys.single(Resource.User, id),
      async () => {
        const user = await this.repo.getUser(id);

        if (!user) throw new ServiceError("User not found", 404);

        return user;
      },
    );
  }

  async getUsers(): Promise<PublicUser[]> {
    return this.cache.remember(CacheKeys.all(Resource.User), () =>
      this.repo.getUsers(),
    );
  }

  async deleteUser(id: string): Promise<void> {
    if (!id) throw new ServiceError("User id must be provided", 404);

    await this.repo.deleteUser(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.User, id),
      CacheKeys.all(Resource.User),
    );
  }
}
