import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createServiceDTO,
  Service,
  ServiceRepository,
  ServiceService,
  UpdateServiceDTO,
} from "./service.types.js";

const REQUIRED_SERVICE_FIELDS: (keyof createServiceDTO)[] = ["slug", "title"];

const UPDATABLE_SERVICE_FIELDS: (keyof UpdateServiceDTO)[] = [
  "slug",
  "title",
  "summary",
  "description",
  "icon",
  "image_url",
  "meta_title",
  "meta_description",
  "sort_order",
  "is_active",
];

export class ServiceServ implements ServiceService {
  constructor(
    private repo: ServiceRepository,
    private cache: Cache,
  ) {}

  async createService(details: createServiceDTO): Promise<Service> {
    if (!details)
      throw new ServiceError("Service details must be provided", 400);

    for (let key of REQUIRED_SERVICE_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newService = await this.repo.createService(details);

    await this.cache.invalidate(CacheKeys.all(Resource.Service));

    return newService;
  }

  async editService(id: string, details: UpdateServiceDTO): Promise<Service> {
    if (!id || !details)
      throw new ServiceError("Service id and details must be provided", 400);

    let filteredDetails: UpdateServiceDTO = {};

    for (let key of UPDATABLE_SERVICE_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedService = await this.repo.editService(id, filteredDetails);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Service, id),
      CacheKeys.all(Resource.Service),
    );

    return patchedService;
  }

  async getService(id: string): Promise<Service> {
    if (!id) throw new ServiceError("Service id must be provided", 400);

    return this.cache.remember(CacheKeys.single(Resource.Service, id), async () => {
      const service = await this.repo.getService(id);

      if (!service) throw new ServiceError("Service not found", 404);

      return service;
    });
  }

  async getServices(): Promise<Service[]> {
    return this.cache.remember(CacheKeys.all(Resource.Service), () =>
      this.repo.getServices(),
    );
  }

  async deleteService(id: string): Promise<void> {
    if (!id) throw new ServiceError("Service id must be provided", 404);

    await this.repo.deleteService(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Service, id),
      CacheKeys.all(Resource.Service),
    );
  }
}
