import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  createLeadDTO,
  Lead,
  LeadRepository,
  LeadService,
  UpdateLeadDTO,
} from "./lead.types.js";

const REQUIRED_LEAD_FIELDS: (keyof createLeadDTO)[] = ["full_name", "phone"];

const UPDATABLE_LEAD_FIELDS: (keyof UpdateLeadDTO)[] = [
  "full_name",
  "email",
  "phone",
  "whatsapp_number",
  "country_code",
  "state_region",
  "city",
  "intent",
  "property_type",
  "property_subtype",
  "preferred_location",
  "budget_min",
  "budget_max",
  "currency_code",
  "requirements",
  "listing_id",
  "user_id",
  "source",
  "source_page",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "assigned_agent_id",
  "first_contacted_at",
  "ip_address",
  "user_agent",
  "consent_marketing",
  "status",
  "lost_reason",
];

export class LeadServ implements LeadService {
  constructor(
    private repo: LeadRepository,
    private cache: Cache,
  ) {}

  async createLead(details: createLeadDTO): Promise<Lead> {
    if (!details) throw new ServiceError("Lead details must be provided", 400);

    for (let key of REQUIRED_LEAD_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newLead = await this.repo.createLead(details);

    await this.cache.invalidate(CacheKeys.all(Resource.Lead));

    return newLead;
  }

  async editLead(id: string, details: UpdateLeadDTO): Promise<Lead> {
    if (!id || !details)
      throw new ServiceError("Lead id and details must be provided", 400);

    let filteredDetails: UpdateLeadDTO = {};

    for (let key of UPDATABLE_LEAD_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedLead = await this.repo.editLead(id, filteredDetails);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Lead, id),
      CacheKeys.all(Resource.Lead),
    );

    return patchedLead;
  }

  async getLead(id: string): Promise<Lead> {
    if (!id) throw new ServiceError("Lead id must be provided", 400);

    return this.cache.remember(CacheKeys.single(Resource.Lead, id), async () => {
      const lead = await this.repo.getLead(id);

      if (!lead) throw new ServiceError("Lead not found", 404);

      return lead;
    });
  }

  async getLeads(): Promise<Lead[]> {
    return this.cache.remember(CacheKeys.all(Resource.Lead), () =>
      this.repo.getLeads(),
    );
  }

  async findLeadByPhone(phone: string): Promise<Lead | null> {
    if (!phone) throw new ServiceError("Phone must be provided", 400);

    // Deliberately uncached — this backs real-time dedup on public form
    // submissions, and a stale "not found" would cause a duplicate lead.
    return this.repo.findLeadByPhone(phone);
  }

  async deleteLead(id: string): Promise<void> {
    if (!id) throw new ServiceError("Lead id must be provided", 404);

    await this.repo.deleteLead(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Lead, id),
      CacheKeys.all(Resource.Lead),
    );
  }
}
