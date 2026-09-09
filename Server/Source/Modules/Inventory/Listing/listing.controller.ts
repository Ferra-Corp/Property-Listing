import type { IncomingMessage, ServerResponse } from "node:http";
import { listingService, logService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const ListingController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = listingService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const listingId = pathnames[2],
          result = listingId
            ? await service.getListing(listingId)
            : await service.getListings();

        sendResponseMessage(200, false, result, response);
        break;
      case "POST":
        await Authorized(request, "Create listing");

        const postRequestBody: any = await getRequestBody(request),
          newListing = await service.createListing(postRequestBody);

        await logService.createLog({
          action: "Listing creation",
          entity_id: newListing.id,
          entity_type: "Listing",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newListing,
        });

        sendResponseMessage(201, false, newListing, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit listing");

        const patchListingId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedListing = await service.editListing(
            patchListingId,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Listing update",
          entity_id: patchedListing.id,
          entity_type: "Listing",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedListing,
        });

        sendResponseMessage(200, false, patchedListing, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete listing");

        const deleteListingId = PathnameValidator(pathnames);

        await service.deleteListing(deleteListingId);

        await logService.createLog({
          action: "Listing deletion",
          entity_id: deleteListingId,
          entity_type: "Listing",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: {},
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
