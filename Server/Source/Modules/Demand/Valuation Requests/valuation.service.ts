import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type { LeadService } from "../Leads/Definition/lead.types.js";
import type {
  createValuationRequestDTO,
  RequestingStaff,
  UpdateValuationRequestDTO,
  ValuationRepository,
  ValuationRequest,
  ValuationService,
} from "./valuation.types.js";

/** An Agent only ever sees/touches their own book; every other role that
 * can reach this module at all (Admin, Viewer) sees the whole one. */
function ownsValuationRequest(
  valuationRequest: ValuationRequest,
  requester: RequestingStaff,
): boolean {
  return (
    requester.role !== "agent" ||
    valuationRequest.assigned_agent_id === requester.id
  );
}

const REQUIRED_VALUATION_FIELDS: (keyof createValuationRequestDTO)[] = [
  "property_type",
  "location_label",
];

const UPDATABLE_VALUATION_FIELDS: (keyof UpdateValuationRequestDTO)[] = [
  "lead_id",
  "property_type",
  "property_subtype",
  "location_label",
  "country_code",
  "state_region",
  "city",
  "neighbourhood",
  "bedrooms",
  "bathrooms",
  "floor_area",
  "floor_area_unit",
  "land_area",
  "land_area_unit",
  "owner_expectation",
  "message",
  "visit_scheduled_at",
  "condition",
  "evaluation_notes",
  "estimated_value",
  "currency_code",
  "valued_at",
  "valued_by",
  "list_out",
  "converted_listing_id",
  "assigned_agent_id",
  "status",
];

export class ValuationServ implements ValuationService {
  constructor(
    private repo: ValuationRepository,
    private leadService: LeadService,
    private cache: Cache,
  ) {}

  async createValuationRequest(
    details: createValuationRequestDTO,
  ): Promise<ValuationRequest> {
    if (!details)
      throw new ServiceError(
        "Valuation request details must be provided",
        400,
      );

    for (let key of REQUIRED_VALUATION_FIELDS) {
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
              property_type: details.property_type,
              property_subtype: details.property_subtype ?? null,
              intent: "valuation",
              source: "valuation_form",
            })
          ).id;
    }

    const newValuationRequest = await this.repo.createValuationRequest({
      ...details,
      lead_id: leadId,
    });

    await this.cache.invalidate(CacheKeys.all(Resource.ValuationRequest));

    return newValuationRequest;
  }

  async editValuationRequest(
    id: string,
    details: UpdateValuationRequestDTO,
    requester: RequestingStaff,
  ): Promise<ValuationRequest> {
    if (!id || !details)
      throw new ServiceError(
        "Valuation request id and details must be provided",
        400,
      );

    // Same "not found" an owner-check on getValuationRequest would give —
    // an Agent probing an id that isn't theirs shouldn't learn it exists.
    await this.getValuationRequest(id, requester);

    let filteredDetails: UpdateValuationRequestDTO = {};

    for (let key of UPDATABLE_VALUATION_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedValuationRequest = await this.repo.editValuationRequest(
      id,
      filteredDetails,
    );

    await this.cache.invalidate(
      CacheKeys.single(Resource.ValuationRequest, id),
      CacheKeys.all(Resource.ValuationRequest),
    );

    return patchedValuationRequest;
  }

  async getValuationRequest(
    id: string,
    requester: RequestingStaff,
  ): Promise<ValuationRequest> {
    if (!id)
      throw new ServiceError("Valuation request id must be provided", 400);

    const valuationRequest = await this.cache.remember(
      CacheKeys.single(Resource.ValuationRequest, id),
      async () => {
        const found = await this.repo.getValuationRequest(id);

        if (!found)
          throw new ServiceError("Valuation request not found", 404);

        return found;
      },
    );

    if (!ownsValuationRequest(valuationRequest, requester))
      throw new ServiceError("Valuation request not found", 404);

    return valuationRequest;
  }

  async getValuationRequests(
    requester: RequestingStaff,
  ): Promise<ValuationRequest[]> {
    const valuationRequests = await this.cache.remember(
      CacheKeys.all(Resource.ValuationRequest),
      () => this.repo.getValuationRequests(),
    );

    if (requester.role !== "agent") return valuationRequests;

    return valuationRequests.filter((valuationRequest) =>
      ownsValuationRequest(valuationRequest, requester),
    );
  }

  async deleteValuationRequest(
    id: string,
    requester: RequestingStaff,
  ): Promise<void> {
    if (!id)
      throw new ServiceError("Valuation request id must be provided", 404);

    await this.getValuationRequest(id, requester);

    await this.repo.deleteValuationRequest(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.ValuationRequest, id),
      CacheKeys.all(Resource.ValuationRequest),
    );
  }
}
