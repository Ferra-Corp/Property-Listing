import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, viewingService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const ViewingController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = viewingService;

  try {
    switch (request.method) {
      case "GET": {
        const viewUser = await Authorized(request, "View viewing request");

        const viewingId = pathnames[2],
          result = viewingId
            ? await service.getViewingRequest(viewingId, viewUser)
            : await service.getViewingRequests(viewUser);

        sendResponseMessage(200, false, result, response);
        break;
      }
      case "POST": {
        // Public "book a viewing" form — visitors submitting requests are never logged in.
        const postRequestBody: any = await getRequestBody(request),
          newViewingRequest =
            await service.createViewingRequest(postRequestBody);

        sendResponseMessage(201, false, newViewingRequest, response);
        break;
      }
      case "PATCH": {
        const user = await Authorized(request, "Edit viewing request"),
          patchViewingId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedViewingRequest = await service.editViewingRequest(
            patchViewingId,
            patchRequestBody,
            user,
          );

        await logService.createLog({
          action: "Viewing request update",
          entity_id: patchedViewingRequest.id,
          entity_type: "Viewing Request",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedViewingRequest,
        });

        sendResponseMessage(200, false, patchedViewingRequest, response);
        break;
      }
      case "DELETE": {
        const user = await Authorized(request, "Delete viewing request"),
          deleteViewingId = PathnameValidator(pathnames);

        await service.deleteViewingRequest(deleteViewingId, user);

        await logService.createLog({
          action: "Viewing request deletion",
          entity_id: deleteViewingId,
          entity_type: "Viewing Request",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: {},
        });

        sendResponseMessage(204, false, null, response);
        break;
      }
      default:
        sendResponseMessage(405, true, "Invalid HTTP Header method", response);
        break;
    }
  } catch (error) {
    const { statusCode, message } = ErrorFormatter(error as Error);

    sendResponseMessage(statusCode, true, message, response);
  }
};
