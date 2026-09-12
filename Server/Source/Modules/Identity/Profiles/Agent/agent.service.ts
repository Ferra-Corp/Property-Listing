import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import { isArrayFieldOp } from "./agent.types.js";
import type {
  AgentProfile,
  AgentRepository,
  AgentService,
  createAgentProfileDTO,
  UpdateAgentProfileDTO,
} from "./agent.types.js";

const ARRAY_FIELDS = new Set<keyof UpdateAgentProfileDTO>([
  "specializations",
  "languages",
]);

const REQUIRED_AGENT_FIELDS: (keyof createAgentProfileDTO)[] = [
  "user_id",
  "slug",
  "display_name",
];

const UPDATABLE_AGENT_FIELDS: (keyof UpdateAgentProfileDTO)[] = [
  "slug",
  "display_name",
  "title",
  "bio",
  "photo_url",
  "license_number",
  "phone",
  "whatsapp_number",
  "email_public",
  "specializations",
  "languages",
  "years_experience",
  "linkedin_url",
  "instagram_url",
  "meta_title",
  "meta_description",
  "is_active",
  "sort_order",
];

export class AgentServ implements AgentService {
  constructor(
    private repo: AgentRepository,
    private cache: Cache,
  ) {}

  async createAgentProfile(
    details: createAgentProfileDTO,
  ): Promise<AgentProfile> {
    if (!details)
      throw new ServiceError("Agent profile details must be provided", 400);

    for (let key of REQUIRED_AGENT_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newAgentProfile = await this.repo.createAgentProfile(details);

    await this.cache.invalidate(
      CacheKeys.all(Resource.Agent),
      `${CacheKeys.all(Resource.Agent)}:public`,
    );

    return newAgentProfile;
  }

  async editAgentProfile(
    id: string,
    details: UpdateAgentProfileDTO,
  ): Promise<AgentProfile> {
    if (!id || !details)
      throw new ServiceError(
        "Agent profile id and details must be provided",
        400,
      );

    let filteredDetails: UpdateAgentProfileDTO = {};

    for (let key of UPDATABLE_AGENT_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      if (ARRAY_FIELDS.has(key)) {
        const isStringArray =
          Array.isArray(value) &&
          value.every((item) => typeof item === "string");

        if (!isStringArray && !isArrayFieldOp(value))
          throw new ServiceError(
            `${key} must be an array of strings, or {action: "add" | "subtract", values: string[]}`,
            400,
          );
      }

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedAgentProfile = await this.repo.editAgentProfile(
      id,
      filteredDetails,
    );

    await this.cache.invalidate(
      CacheKeys.single(Resource.Agent, id),
      `${CacheKeys.single(Resource.Agent, id)}:public`,
      CacheKeys.all(Resource.Agent),
      `${CacheKeys.all(Resource.Agent)}:public`,
    );

    return patchedAgentProfile;
  }

  async getAgentProfile(
    id: string,
    publicOnly = false,
  ): Promise<AgentProfile> {
    if (!id) throw new ServiceError("Agent profile id must be provided", 400);

    const cacheKey = publicOnly
      ? `${CacheKeys.single(Resource.Agent, id)}:public`
      : CacheKeys.single(Resource.Agent, id);

    return this.cache.remember(cacheKey, async () => {
      const agentProfile = await this.repo.getAgentProfile(id, publicOnly);

      if (!agentProfile) throw new ServiceError("Agent profile not found", 404);

      return agentProfile;
    });
  }

  async getAgentProfiles(publicOnly = false): Promise<AgentProfile[]> {
    const cacheKey = publicOnly
      ? `${CacheKeys.all(Resource.Agent)}:public`
      : CacheKeys.all(Resource.Agent);

    return this.cache.remember(cacheKey, () =>
      this.repo.getAgentProfiles(publicOnly),
    );
  }

  async deleteAgentProfile(id: string): Promise<void> {
    if (!id) throw new ServiceError("Agent profile id must be provided", 404);

    await this.repo.deleteAgentProfile(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Agent, id),
      `${CacheKeys.single(Resource.Agent, id)}:public`,
      CacheKeys.all(Resource.Agent),
      `${CacheKeys.all(Resource.Agent)}:public`,
    );
  }
}
