/**
 * Demo/test data for exercising the public frontend (listings, agents,
 * insights, services) against real records instead of mock arrays. Safe to
 * run once against a dev database — run with `npx tsx ./Migrations/SeedDemo.ts`.
 * Distinct from Seed.ts, which only bootstraps the admin account.
 */
import {
  authService,
  userService,
  agentService,
  currencyService,
  listingService,
  insightService,
  tagService,
  insightTagService,
  serviceService,
} from "../Source/Data Objects/DTO.js";
import type { RegisterDTO } from "../Source/Modules/Identity/Authentication/authentication.types.js";
import { ErrorMsg, Info } from "../Source/Utilities/Logger.js";

const DEMO_PASSWORD = "DemoAgent2026!";

async function createAgent(details: {
  name: string;
  email: string;
  phone: string;
  slug: string;
  display_name: string;
  title: string;
  bio: string;
  specializations: string[];
  languages: string[];
  years_experience: number;
  whatsapp_number: string;
  email_public: string;
}) {
  const registerDetails: RegisterDTO = {
    name: details.name,
    email: details.email,
    password: DEMO_PASSWORD,
    phone: details.phone,
  };

  const { user } = await authService.register(registerDetails, {
    ipAddress: "0.0.0.0",
    userAgent: "SeedDemo",
  });

  await userService.editUser(user.id, { role: "agent" });

  const agentProfile = await agentService.createAgentProfile({
    user_id: user.id,
    slug: details.slug,
    display_name: details.display_name,
    title: details.title,
    bio: details.bio,
    phone: details.phone,
    whatsapp_number: details.whatsapp_number,
    email_public: details.email_public,
    specializations: details.specializations,
    languages: details.languages,
    years_experience: details.years_experience,
    is_active: true,
  });

  return { userId: user.id, agentProfile };
}

(async () => {
  try {
    // ── Currencies ──────────────────────────────────────────────────────
    for (const currency of [
      { code: "GBP", symbol: "£", name: "British Pound", decimal_places: 2, is_active: true, sort_order: 4 },
      { code: "AED", symbol: "د.إ", name: "UAE Dirham", decimal_places: 2, is_active: true, sort_order: 5 },
    ]) {
      try {
        await currencyService.createCurrency(currency);
      } catch {
        // already exists — fine
      }
    }
    Info("Currencies seeded");

    // ── Agents ──────────────────────────────────────────────────────────
    const sarah = await createAgent({
      name: "Sarah Kamau",
      email: "sarah.kamau@demo.entity.co.ke",
      phone: "+254711000001",
      slug: "sarah-kamau",
      display_name: "Sarah Kamau",
      title: "Commercial & industrial consultant",
      bio: "Nine years letting and selling industrial space on the eastern side of Nairobi. Measures every building herself before it is listed.",
      specializations: ["Go-downs", "Warehousing", "Industrial land"],
      languages: ["English", "Kiswahili"],
      years_experience: 9,
      whatsapp_number: "+254711000001",
      email_public: "sarah@demo.entity.co.ke",
    });

    const james = await createAgent({
      name: "James Otieno",
      email: "james.otieno@demo.entity.co.ke",
      phone: "+254711000002",
      slug: "james-otieno",
      display_name: "James Otieno",
      title: "Offices & retail consultant",
      bio: "Six years on office and retail leasing in Westlands, Kilimani and the CBD fringe, including fit-out negotiation.",
      specializations: ["Fitted offices", "Shell space", "Retail"],
      languages: ["English", "Kiswahili"],
      years_experience: 6,
      whatsapp_number: "+254711000002",
      email_public: "james@demo.entity.co.ke",
    });

    const amina = await createAgent({
      name: "Amina Hassan",
      email: "amina.hassan@demo.entity.co.ke",
      phone: "+254711000003",
      slug: "amina-hassan",
      display_name: "Amina Hassan",
      title: "Residential & diaspora consultant",
      bio: "Five years on upmarket homes in Karen, Runda and Kilimani, with most purchases arranged for buyers based abroad.",
      specializations: ["Villas", "Apartments", "Diaspora sales"],
      languages: ["English", "Kiswahili", "Arabic"],
      years_experience: 5,
      whatsapp_number: "+254711000003",
      email_public: "amina@demo.entity.co.ke",
    });

    Info("Agents seeded");

    // ── Listings ────────────────────────────────────────────────────────
    const listingDefs = [
      {
        reference_code: "DEMO-IND-0001",
        slug: "go-down-rail-siding-mombasa-road",
        title: "Go-down with rail siding, Mombasa Road",
        description:
          "Clear-span shed with two dock-level bays, a private siding and 0.9 acre of hardstanding. Available on a six-year term from November.",
        property_type: "industrial" as const,
        property_subtype: "go_down" as const,
        purpose: "lease" as const,
        status: "published" as const,
        state_region: "Nairobi",
        city: "Nairobi",
        location_label: "Mombasa Road, Nairobi",
        price: 71,
        currency_code: "KES",
        price_period: "per_sqft_month" as const,
        floor_area: 24000,
        floor_area_unit: "sqft" as const,
        is_exclusive: true,
        agent_id: sarah.userId,
        media: [{ url: "https://picsum.photos/seed/godown1/1600/1000", alt_text: "Go-down exterior, Mombasa Road", is_primary: true }],
      },
      {
        reference_code: "DEMO-IND-0002",
        slug: "warehouse-hardstanding-eastern-bypass",
        title: "Warehouse and hardstanding yard, Eastern Bypass",
        description:
          "Purpose-built distribution facility completed 2021, four minutes from the interchange, with a fitted two-storey office block.",
        property_type: "industrial" as const,
        property_subtype: "warehouse" as const,
        purpose: "lease" as const,
        status: "published" as const,
        state_region: "Kiambu",
        city: "Ruiru",
        location_label: "Ruiru, Kiambu County",
        price: 78,
        currency_code: "KES",
        price_period: "per_sqft_month" as const,
        floor_area: 18400,
        floor_area_unit: "sqft" as const,
        agent_id: sarah.userId,
        media: [{ url: "https://picsum.photos/seed/warehouse1/1600/1000", alt_text: "Warehouse, Eastern Bypass", is_primary: true }],
      },
      {
        reference_code: "DEMO-IND-0003",
        slug: "unit-c4-tatu-industrial-park",
        title: "Unit C4, Tatu Industrial Park",
        description:
          "Serviced park unit with shared loading court, standby generator and estate security.",
        property_type: "industrial" as const,
        property_subtype: "industrial_park" as const,
        purpose: "lease" as const,
        status: "published" as const,
        state_region: "Kiambu",
        city: "Ruiru",
        location_label: "Thika Road, Kiambu County",
        price: 84,
        currency_code: "KES",
        price_period: "per_sqft_month" as const,
        floor_area: 9800,
        floor_area_unit: "sqft" as const,
        agent_id: sarah.userId,
        media: [{ url: "https://picsum.photos/seed/tatuunit/1600/1000", alt_text: "Unit C4, Tatu Industrial Park", is_primary: true }],
      },
      {
        reference_code: "DEMO-IND-0004",
        slug: "secured-yard-workshop-athi-river",
        title: "Secured yard and workshop, Athi River",
        description:
          "Walled and gated yard on tarmac frontage with a steel workshop and staff block. Freehold title.",
        property_type: "industrial" as const,
        property_subtype: "yard" as const,
        purpose: "sale" as const,
        status: "sold" as const,
        state_region: "Machakos",
        city: "Athi River",
        location_label: "Athi River, Machakos County",
        price: 210000000,
        currency_code: "KES",
        price_period: "total" as const,
        land_area: 2.4,
        land_area_unit: "acre" as const,
        is_exclusive: true,
        agent_id: sarah.userId,
        media: [{ url: "https://picsum.photos/seed/yardathi/1600/1000", alt_text: "Yard and workshop, Athi River", is_primary: true }],
      },
      {
        reference_code: "DEMO-COM-0001",
        slug: "fitted-office-floor-westlands",
        title: "Fitted office floor, Muthithi Road",
        description:
          "Fitted office floor with a fitted reception, meeting rooms and open-plan desking for around eighty staff.",
        property_type: "commercial" as const,
        property_subtype: "office" as const,
        purpose: "lease" as const,
        status: "published" as const,
        state_region: "Nairobi",
        city: "Nairobi",
        location_label: "Muthithi Road, Westlands",
        price: 118,
        currency_code: "KES",
        price_period: "per_sqft_month" as const,
        floor_area: 6400,
        floor_area_unit: "sqft" as const,
        agent_id: james.userId,
        media: [{ url: "https://picsum.photos/seed/officewestlands/1600/1000", alt_text: "Office floor, Westlands", is_primary: true }],
      },
      {
        reference_code: "DEMO-COM-0002",
        slug: "retail-showroom-kilimani",
        title: "Retail showroom, Kilimani",
        description:
          "Ground-floor showroom with full-height glazing and a loading bay to the rear, on a busy pedestrian frontage.",
        property_type: "commercial" as const,
        property_subtype: "retail" as const,
        purpose: "lease" as const,
        status: "published" as const,
        state_region: "Nairobi",
        city: "Nairobi",
        location_label: "Kilimani, Nairobi",
        price: 145,
        currency_code: "KES",
        price_period: "per_sqft_month" as const,
        floor_area: 2200,
        floor_area_unit: "sqft" as const,
        agent_id: james.userId,
        media: [{ url: "https://picsum.photos/seed/retailkilimani/1600/1000", alt_text: "Retail showroom, Kilimani", is_primary: true }],
      },
      {
        reference_code: "DEMO-RES-0001",
        slug: "walled-family-home-karen",
        title: "Walled family home, Karen Road",
        description:
          "Five-bedroom family home on half an acre, with a mature garden, staff quarters and a double carport.",
        property_type: "residential" as const,
        property_subtype: "villa" as const,
        purpose: "sale" as const,
        status: "published" as const,
        state_region: "Nairobi",
        city: "Nairobi",
        location_label: "Karen, Nairobi",
        price: 165000000,
        currency_code: "KES",
        price_period: "total" as const,
        bedrooms: 5,
        bathrooms: 5,
        land_area: 0.5,
        land_area_unit: "acre" as const,
        is_exclusive: true,
        agent_id: amina.userId,
        media: [{ url: "https://picsum.photos/seed/villakaren/1600/1000", alt_text: "Family home, Karen Road", is_primary: true }],
      },
      {
        reference_code: "DEMO-RES-0002",
        slug: "two-bedroom-apartment-kilimani",
        title: "Two-bedroom apartment, Kilimani",
        description:
          "Furnished two-bedroom apartment in a gated development with a pool, gym and backup generator.",
        property_type: "residential" as const,
        property_subtype: "apartment" as const,
        purpose: "rent" as const,
        status: "rented" as const,
        state_region: "Nairobi",
        city: "Nairobi",
        location_label: "Kilimani, Nairobi",
        price: 120000,
        currency_code: "KES",
        price_period: "per_month" as const,
        bedrooms: 2,
        bathrooms: 2,
        agent_id: amina.userId,
        media: [{ url: "https://picsum.photos/seed/apartmentkilimani/1600/1000", alt_text: "Apartment, Kilimani", is_primary: true }],
      },
    ];

    for (const listingDef of listingDefs) {
      await listingService.createListing(listingDef);
    }
    Info("Listings seeded");

    // ── Tags ────────────────────────────────────────────────────────────
    const ratesTag = await tagService.createTag({ name: "Rates & yields", slug: "rates-yields" }),
      areaGuideTag = await tagService.createTag({ name: "Area guides", slug: "area-guides" }),
      abroadTag = await tagService.createTag({ name: "Buying from abroad", slug: "buying-from-abroad" });

    Info("Tags seeded");

    // ── Insights ────────────────────────────────────────────────────────
    const insightDefs = [
      {
        slug: "warehouse-rates-mombasa-road",
        title: "Warehouse rates on Mombasa Road, quarter by quarter",
        summary:
          "Twelve months of signed leases along the corridor: what tenants actually paid per square foot, and why the top of the range moved while the bottom did not.",
        content:
          "<p>The Mombasa Road corridor is still the deepest warehousing market in the metropolitan area, and for most of the last decade its rates moved as one number. That stopped some time around the middle of last year.</p><p>In the twelve months to August we recorded agreed rents between KES 55 and KES 95 per square foot per month on the same stretch — a spread wide enough that quoting a single corridor average is now actively misleading to a tenant.</p><h2>Why the top moved</h2><p>Operators who need dock-level loading and nine metres of eaves have almost no alternative on this corridor, and scarcity at the top of a market is a rate story before it is anything else.</p>",
        author_id: sarah.userId,
        target_city: "Nairobi",
        target_state_region: "Nairobi",
        target_country_code: "KE",
        status: "published" as const,
        word_count: 780,
        published_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
        tagId: ratesTag.id,
      },
      {
        slug: "eastern-bypass-logistics-traffic",
        title: "Why the Eastern Bypass took the logistics traffic",
        summary:
          "Serviced land, interchange access and the yards that followed — and what it did to Ruiru rents.",
        content:
          "<p>The arrival of serviced park stock north and east of the city did not take pressure off the Mombasa Road corridor — it took the tenants who were indifferent to location, and left behind the distributors serving the port road and the airport.</p><p>Ruiru absorbed most of that demand, and rents there have moved accordingly over the past eighteen months.</p>",
        author_id: sarah.userId,
        target_city: "Ruiru",
        target_state_region: "Kiambu",
        target_country_code: "KE",
        status: "published" as const,
        word_count: 540,
        published_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
        tagId: areaGuideTag.id,
      },
      {
        slug: "office-rents-westlands-fit-out-cycle",
        title: "Office rents in Westlands after the fit-out cycle",
        summary:
          "Why fitted floors let at a premium the shell market has stopped chasing.",
        content:
          "<p>Fitted floors in Westlands and Kilimani are letting at a clear premium over shell space, as tenants weigh the cost and disruption of fitting out a floor themselves against paying more for one that is ready to occupy.</p>",
        author_id: james.userId,
        target_city: "Nairobi",
        target_state_region: "Nairobi",
        target_country_code: "KE",
        status: "published" as const,
        word_count: 460,
        published_at: new Date(Date.now() - 35 * 86_400_000).toISOString(),
        tagId: ratesTag.id,
      },
      {
        slug: "karen-runda-what-your-budget-buys",
        title: "Karen and Runda: what your budget actually buys in 2026",
        summary:
          "Plot sizes, ages and the running costs nobody quotes on the listing.",
        content:
          "<p>Buyers looking at Karen and Runda in the KES 80 to 200 million range are, in practice, choosing between plot size and house age — the two rarely come together at this price point anymore.</p>",
        author_id: amina.userId,
        target_city: "Nairobi",
        target_state_region: "Nairobi",
        target_country_code: "KE",
        status: "published" as const,
        word_count: 610,
        published_at: new Date(Date.now() - 12 * 86_400_000).toISOString(),
        tagId: areaGuideTag.id,
      },
      {
        slug: "buying-from-abroad-a-plain-sequence",
        title: "Buying from abroad: a plain sequence",
        summary:
          "A straightforward sequence for buyers who cannot be in the room, and the points where deals usually stall.",
        content:
          "<p>Most of our diaspora purchases follow the same shape: a video walkthrough, an advocate engaged locally, and a power of attorney arranged before any offer is made. The deals that stall are almost always the ones that skip the second step.</p>",
        author_id: amina.userId,
        target_city: null,
        target_state_region: null,
        target_country_code: null,
        status: "published" as const,
        word_count: 390,
        published_at: new Date(Date.now() - 45 * 86_400_000).toISOString(),
        tagId: abroadTag.id,
      },
    ];

    for (const { tagId, ...insightDef } of insightDefs) {
      const insight = await insightService.createInsight(insightDef);
      await insightTagService.attachTag({ insight_id: insight.id, tag_id: tagId });
    }
    Info("Insights seeded");

    // ── Services ────────────────────────────────────────────────────────
    const serviceDefs = [
      {
        slug: "commercial-leasing",
        title: "Commercial leasing",
        summary:
          "We let go-downs, industrial park units, offices, retail and yards on terms written for the tenant's use rather than the landlord's template.",
        description:
          "Includes a measured survey and photography, rate advice from agreed comparables, marketing, viewings conducted by the agent, and heads of terms sent to your advocate.",
        is_active: true,
        sort_order: 1,
      },
      {
        slug: "sales-acquisition",
        title: "Sales & acquisition",
        summary:
          "Sale of yards, development sites, industrial buildings and upmarket homes, and buying briefs handled discreetly for clients who would rather not be seen looking.",
        description:
          "Includes pricing on comparable evidence, a title and encumbrance check with your advocate, buyer qualification before viewings, and negotiation through to completion.",
        is_active: true,
        sort_order: 2,
      },
      {
        slug: "valuation-advice",
        title: "Valuation & advice",
        summary:
          "A site visit, comparable evidence and a written figure you can take to a bank, a buyer, a partner or a court.",
        description:
          "Includes a measured inspection, a comparable schedule, rental and capital figures, and a written report within five working days.",
        is_active: true,
        sort_order: 3,
      },
      {
        slug: "tenant-representation",
        title: "Tenant representation",
        summary:
          "Give us the specification and we search the whole market, including stock that is not advertised, and return a shortlist with the arithmetic done.",
        description:
          "Includes a written brief agreed with you, off-market approaches to owners, a shortlist of three or four options with rates, and accompanied viewings.",
        is_active: true,
        sort_order: 4,
      },
    ];

    for (const serviceDef of serviceDefs) {
      await serviceService.createService(serviceDef);
    }
    Info("Services seeded");

    Info("Demo seed generation successful");
    process.exit(0);
  } catch (error) {
    ErrorMsg(error as Error);
    process.exit(1);
  }
})();
