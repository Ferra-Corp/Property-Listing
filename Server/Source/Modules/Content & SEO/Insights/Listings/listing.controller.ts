import type { IncomingMessage, ServerResponse } from "node:http";
import {
  insightListingService,
  logService,
} from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
  ServiceError,
  getClientDetails,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";

export const InsightListingController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = insightListingService;

  try {
    const user = await AuthToken(request);
    const insightId = PathnameValidator(pathnames);

    switch (request.method) {
      case "GET":
        const links = await service.getListingsForInsight(insightId);

        sendResponseMessage(200, false, links, response);
        break;
      case "POST":
        const body: any = await getRequestBody(request),
          newLink = await service.attachListing({
            insight_id: insightId,
            listing_id: body.listing_id,
            sort_order: body.sort_order,
          });

        await logService.createLog({
          action: "Listing link creation",
          changes: newLink,
          entity_id: newLink.listing_id,
          entity_type: "Insight-Listing link",
          ip_address: userAgent.ipAddress,
          user_agent: userAgent.deviceName,
          user_id: user.id,
        });

        sendResponseMessage(201, false, newLink, response);
        break;
      case "DELETE":
        const listingId = pathnames[3];

        if (!listingId)
          throw new ServiceError("Specify listing id in url segment", 400);

        await service.detachListing(insightId, listingId);

        await logService.createLog({
          action: "Listing link deletion",
          changes: {},
          entity_id: listingId,
          entity_type: "Insight-Listing link",
          ip_address: userAgent.ipAddress,
          user_agent: userAgent.deviceName,
          user_id: user.id,
        });

        sendResponseMessage(204, false, null, response);
        break;
      default:
        sendResponseMessage(405, true, "Invalid HTTP Header method", response);
        break;
    }
  } catch (error) {
    const { statusCode, message } = ErrorFormatter(error as Error);

    sendResponseMessage(statusCode, true, message, response);
  }
};
