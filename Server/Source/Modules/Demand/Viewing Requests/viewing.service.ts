import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type { LeadService } from "../Leads/Definition/lead.types.js";
import type {
  createViewingRequestDTO,
  RequestingStaff,
  UpdateViewingRequestDTO,
  ViewingRepository,
  ViewingRequest,
  ViewingService,
} from "./viewing.types.js";

/** An Agent only ever sees/touches their own book; every other role that
 * can reach this module at all (Admin, Viewer) sees the whole one. */
function ownsViewingRequest(
  viewingRequest: ViewingRequest,
  requester: RequestingStaff,
): boolean {
  return (
    requester.role !== "agent" ||
    viewingRequest.assigned_agent_id === requester.id
  );
}

const REQUIRED_VIEWING_FIELDS: (keyof createViewingRequestDTO)[] = [
  "listing_id",
  "preferred_date",
];

const UPDATABLE_VIEWING_FIELDS: (keyof UpdateViewingRequestDTO)[] = [
  "listing_id",
  "lead_id",
  "preferred_date",
  "preferred_time_slot",
  "alternate_date",
  "assigned_agent_id",
  "message",
  "status",
  "confirmed_at",
  "internal_notes",
  "cancelled_reason",
];

export class ViewingServ implements ViewingService {
  constructor(
    private repo: ViewingRepository,
    private leadService: LeadService,
    private cache: Cache,
  ) {}

  async createViewingRequest(
    details: createViewingRequestDTO,
  ): Promise<ViewingRequest> {
    if (!details)
      throw new ServiceError("Viewing request details must be provided", 400);

    for (let key of REQUIRED_VIEWING_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    let leadId = details.lead_id;

    if (!leadId) {
      if (!details.full_name || !details.phone)
        throw new ServiceError(
          "lead_id, or full_name and phone, must be provided",
          400,
        );

      const existingLead = await this.leadService.findLeadByPhone(
        details.phone,
      );

      leadId = existingLead
        ? existingLead.id
        : (
            await this.leadService.createLead({
              full_name: details.full_name,
              phone: details.phone,
              email: details.email ?? null,
              whatsapp_number: details.whatsapp_number ?? null,
              listing_id: details.listing_id,
              source: "viewing_form",
            })
          ).id;
    }

    const newViewingRequest = await this.repo.createViewingRequest({
      ...details,
      lead_id: leadId,
    });

    await this.cache.invalidate(CacheKeys.all(Resource.ViewingRequest));

    return newViewingRequest;
  }

  async editViewingRequest(
    id: string,
    details: UpdateViewingRequestDTO,
    requester: RequestingStaff,
  ): Promise<ViewingRequest> {
    if (!id || !details)
      throw new ServiceError(
        "Viewing request id and details must be provided",
        400,
      );

    // Same "not found" an owner-check on getViewingRequest would give — an
    // Agent probing an id that isn't theirs shouldn't learn it exists.
    await this.getViewingRequest(id, requester);

    let filteredDetails: UpdateViewingRequestDTO = {};

    for (let key of UPDATABLE_VIEWING_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    // The DB requires confirmed_at whenever status is 'confirmed'; the caller doesn't
    // have to supply it themselves — the server stamps the moment of confirmation,
    // unless a specific time was already given (e.g. backfilling a phone confirmation).
    if (
      filteredDetails.status === "confirmed" &&
      !filteredDetails.confirmed_at
    )
      filteredDetails.confirmed_at = new Date().toISOString();

    const patchedViewingRequest = await this.repo.editViewingRequest(
      id,
      filteredDetails,
    );

    await this.cache.invalidate(
      CacheKeys.single(Resource.ViewingRequest, id),
      CacheKeys.all(Resource.ViewingRequest),
    );

    return patchedViewingRequest;
  }

  async getViewingRequest(
    id: string,
    requester: RequestingStaff,
  ): Promise<ViewingRequest> {
    if (!id)
      throw new ServiceError("Viewing request id must be provided", 400);

    const viewingRequest = await this.cache.remember(
      CacheKeys.single(Resource.ViewingRequest, id),
      async () => {
        const found = await this.repo.getViewingRequest(id);

        if (!found) throw new ServiceError("Viewing request not found", 404);

        return found;
      },
    );

    if (!ownsViewingRequest(viewingRequest, requester))
      throw new ServiceError("Viewing request not found", 404);

    return viewingRequest;
  }

  async getViewingRequests(
    requester: RequestingStaff,
  ): Promise<ViewingRequest[]> {
    const viewingRequests = await this.cache.remember(
      CacheKeys.all(Resource.ViewingRequest),
      () => this.repo.getViewingRequests(),
    );

    if (requester.role !== "agent") return viewingRequests;

    return viewingRequests.filter((viewingRequest) =>
      ownsViewingRequest(viewingRequest, requester),
    );
  }

  async deleteViewingRequest(
    id: string,
    requester: RequestingStaff,
  ): Promise<void> {
    if (!id)
      throw new ServiceError("Viewing request id must be provided", 404);

    await this.getViewingRequest(id, requester);

    await this.repo.deleteViewingRequest(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.ViewingRequest, id),
      CacheKeys.all(Resource.ViewingRequest),
    );
  }
}
