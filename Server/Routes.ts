import type { IncomingMessage, ServerResponse } from "node:http";
import { AuditController } from "./Source/Modules/Operations/Audit Logs/audit.controller.js";
import { CurrencyController } from "./Source/Modules/Operations/Currencies/currency.controller.js";
import { RateController } from "./Source/Modules/Operations/Exchange Rates/rates.controller.js";
import { ViewController } from "./Source/Modules/Operations/Listing Views/view.controller.js";
import { NotificationController } from "./Source/Modules/Operations/Notifications/notification.controller.js";
import { RedirectController } from "./Source/Modules/Operations/Redirects/redirect.controller.js";
import { SettingsController } from "./Source/Modules/Operations/Site Settings/settings.controller.js";
import { ListingController } from "./Source/Modules/Inventory/Listing/listing.controller.js";
import { MediaController } from "./Source/Modules/Inventory/Media/media.controller.js";
import { UserController } from "./Source/Modules/Identity/Profiles/User/user.controller.js";
import { AgentController } from "./Source/Modules/Identity/Profiles/Agent/agent.controller.js";
import { AuthenticationController } from "./Source/Modules/Identity/Authentication/authentication.controller.js";
import { LeadController } from "./Source/Modules/Demand/Leads/Definition/lead.controller.js";
import { ActivityController } from "./Source/Modules/Demand/Leads/Activity/activity.controller.js";
import { ViewingController } from "./Source/Modules/Demand/Viewing Requests/viewing.controller.js";
import { ValuationController } from "./Source/Modules/Demand/Valuation Requests/valuation.controller.js";
import { InsightController } from "./Source/Modules/Content & SEO/Insights/Definition/insight.controller.js";
import { InsightViewController } from "./Source/Modules/Content & SEO/Insights/Views/view.controller.js";
import { InsightListingController } from "./Source/Modules/Content & SEO/Insights/Listings/listing.controller.js";
import { InsightTagController } from "./Source/Modules/Content & SEO/Insights/Tags/tag.controller.js";
import { TagController } from "./Source/Modules/Content & SEO/Tags/tag.controller.js";
import { ServiceController } from "./Source/Modules/Content & SEO/Services/service.controller.js";
import { TestimonialController } from "./Source/Modules/Content & SEO/Testimonials/testimonial.controller.js";
import { UploadController } from "./Source/Modules/Content & SEO/Media/upload.controller.js";
import { SubscriberController } from "./Source/Modules/Demand/Subscribers/subscriber.controller.js";

interface Route {
  name: string;
  controller: (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage>,
  ) => void;
}

export const Routes: Route[] = [
  {
    name: "audit",
    controller: AuditController,
  },
  {
    name: "currencies",
    controller: CurrencyController,
  },
  {
    name: "exchange-rates",
    controller: RateController,
  },
  {
    name: "listing-views",
    controller: ViewController,
  },
  {
    name: "notifications",
    controller: NotificationController,
  },
  {
    name: "redirects",
    controller: RedirectController,
  },
  {
    name: "settings",
    controller: SettingsController,
  },
  {
    name: "listings",
    controller: ListingController,
  },
  {
    name: "media",
    controller: MediaController,
  },
  {
    name: "users",
    controller: UserController,
  },
  {
    name: "agents",
    controller: AgentController,
  },
  {
    name: "auth",
    controller: AuthenticationController,
  },
  {
    name: "leads",
    controller: LeadController,
  },
  {
    name: "lead-activities",
    controller: ActivityController,
  },
  {
    name: "viewing-requests",
    controller: ViewingController,
  },
  {
    name: "valuation-requests",
    controller: ValuationController,
  },
  {
    name: "insights",
    controller: InsightController,
  },
  {
    name: "insight-views",
    controller: InsightViewController,
  },
  {
    name: "insight-listings",
    controller: InsightListingController,
  },
  {
    name: "tags",
    controller: TagController,
  },
  {
    name: "insight-tags",
    controller: InsightTagController,
  },
  {
    name: "services",
    controller: ServiceController,
  },
  {
    name: "testimonials",
    controller: TestimonialController,
  },
  {
    name: "uploads",
    controller: UploadController,
  },
  {
    name: "subscribers",
    controller: SubscriberController,
  },
];
