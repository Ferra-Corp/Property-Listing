import { Database } from "../../Configurations/Database.js";
import { Cache } from "../../Configurations/Cache.js";
import { LogRepo } from "../Modules/Operations/Audit Logs/audit.repository.js";
import { LogServ } from "../Modules/Operations/Audit Logs/audit.service.js";
import { CurrencyRepo } from "../Modules/Operations/Currencies/currency.repository.js";
import { CurrencyServ } from "../Modules/Operations/Currencies/currency.service.js";
import { RateRepo } from "../Modules/Operations/Exchange Rates/rates.repository.js";
import { RateServ } from "../Modules/Operations/Exchange Rates/rates.service.js";
import { ViewRepo } from "../Modules/Operations/Listing Views/view.repository.js";
import { ViewServ } from "../Modules/Operations/Listing Views/view.service.js";
import { NotificationRepo } from "../Modules/Operations/Notifications/notification.repository.js";
import { NotificationServ } from "../Modules/Operations/Notifications/notification.service.js";
import { RedirectRepo } from "../Modules/Operations/Redirects/redirect.repository.js";
import { RedirectServ } from "../Modules/Operations/Redirects/redirect.service.js";
import { SettingsRepo } from "../Modules/Operations/Site Settings/settings.repository.js";
import { SettingsServ } from "../Modules/Operations/Site Settings/settings.service.js";
import { ListingRepo } from "../Modules/Inventory/Listing/listing.repository.js";
import { ListingServ } from "../Modules/Inventory/Listing/listing.service.js";
import { MediaRepo } from "../Modules/Inventory/Media/media.repository.js";
import { MediaServ } from "../Modules/Inventory/Media/media.service.js";
import { UserRepo } from "../Modules/Identity/Profiles/User/user.repository.js";
import { UserServ } from "../Modules/Identity/Profiles/User/user.service.js";
import { AgentRepo } from "../Modules/Identity/Profiles/Agent/agent.repository.js";
import { AgentServ } from "../Modules/Identity/Profiles/Agent/agent.service.js";
import { AuthRepo } from "../Modules/Identity/Authentication/authentication.repository.js";
import { AuthServ } from "../Modules/Identity/Authentication/authentication.service.js";
import { LeadRepo } from "../Modules/Demand/Leads/Definition/lead.repository.js";
import { LeadServ } from "../Modules/Demand/Leads/Definition/lead.service.js";
import { ActivityRepo } from "../Modules/Demand/Leads/Activity/activity.repository.js";
import { ActivityServ } from "../Modules/Demand/Leads/Activity/activity.service.js";
import { ViewingRepo } from "../Modules/Demand/Viewing Requests/viewing.repository.js";
import { ViewingServ } from "../Modules/Demand/Viewing Requests/viewing.service.js";
import { ValuationRepo } from "../Modules/Demand/Valuation Requests/valuation.repository.js";
import { ValuationServ } from "../Modules/Demand/Valuation Requests/valuation.service.js";
import { InsightRepo } from "../Modules/Content & SEO/Insights/Definition/insight.repository.js";
import { InsightServ } from "../Modules/Content & SEO/Insights/Definition/insight.service.js";
import { InsightListingRepo } from "../Modules/Content & SEO/Insights/Listings/listing.repository.js";
import { InsightListingServ } from "../Modules/Content & SEO/Insights/Listings/listing.service.js";
import { InsightViewRepo } from "../Modules/Content & SEO/Insights/Views/view.repository.js";
import { InsightViewServ } from "../Modules/Content & SEO/Insights/Views/view.service.js";
import { InsightTagRepo } from "../Modules/Content & SEO/Insights/Tags/tag.repository.js";
import { InsightTagServ } from "../Modules/Content & SEO/Insights/Tags/tag.service.js";
import { TagRepo } from "../Modules/Content & SEO/Tags/tag.repository.js";
import { TagServ } from "../Modules/Content & SEO/Tags/tag.service.js";
import { ServiceRepo } from "../Modules/Content & SEO/Services/service.repository.js";
import { ServiceServ } from "../Modules/Content & SEO/Services/service.service.js";
import { TestimonialRepo } from "../Modules/Content & SEO/Testimonials/testimonial.repository.js";
import { TestimonialServ } from "../Modules/Content & SEO/Testimonials/testimonial.service.js";
import { SubscriberRepo } from "../Modules/Demand/Subscribers/subscriber.repository.js";
import { SubscriberServ } from "../Modules/Demand/Subscribers/subscriber.service.js";

const db = new Database();
const cache = new Cache();

export const logRepo = new LogRepo(db),
  currencyRepo = new CurrencyRepo(db),
  rateRepo = new RateRepo(db),
  viewRepo = new ViewRepo(db),
  notificationRepo = new NotificationRepo(db),
  redirectRepo = new RedirectRepo(db),
  settingsRepo = new SettingsRepo(db),
  listingRepo = new ListingRepo(db),
  mediaRepo = new MediaRepo(db),
  userRepo = new UserRepo(db),
  agentRepo = new AgentRepo(db),
  authRepo = new AuthRepo(db),
  leadRepo = new LeadRepo(db),
  activityRepo = new ActivityRepo(db),
  viewingRepo = new ViewingRepo(db),
  valuationRepo = new ValuationRepo(db),
  insightRepo = new InsightRepo(db),
  insightViewRepo = new InsightViewRepo(db),
  insightListingRepo = new InsightListingRepo(db),
  tagRepo = new TagRepo(db),
  insightTagRepo = new InsightTagRepo(db),
  serviceRepo = new ServiceRepo(db),
  testimonialRepo = new TestimonialRepo(db),
  subscriberRepo = new SubscriberRepo(db);

export const logService = new LogServ(logRepo),
  currencyService = new CurrencyServ(currencyRepo, cache),
  rateService = new RateServ(rateRepo, cache),
  viewService = new ViewServ(viewRepo, cache),
  notificationService = new NotificationServ(notificationRepo, cache),
  redirectService = new RedirectServ(redirectRepo, cache),
  settingsService = new SettingsServ(settingsRepo, cache),
  mediaService = new MediaServ(mediaRepo, cache),
  subscriberService = new SubscriberServ(subscriberRepo),
  listingService = new ListingServ(
    listingRepo,
    mediaService,
    cache,
    subscriberService,
  ),
  userService = new UserServ(userRepo, cache),
  agentService = new AgentServ(agentRepo, cache),
  authService = new AuthServ(authRepo, userService),
  leadService = new LeadServ(leadRepo, cache),
  activityService = new ActivityServ(activityRepo, cache),
  viewingService = new ViewingServ(viewingRepo, leadService, cache),
  valuationService = new ValuationServ(valuationRepo, leadService, cache),
  insightService = new InsightServ(insightRepo, cache),
  insightViewService = new InsightViewServ(insightViewRepo, cache),
  insightListingService = new InsightListingServ(insightListingRepo, cache),
  tagService = new TagServ(tagRepo, cache),
  insightTagService = new InsightTagServ(insightTagRepo, cache),
  serviceService = new ServiceServ(serviceRepo, cache),
  testimonialService = new TestimonialServ(testimonialRepo, cache);
