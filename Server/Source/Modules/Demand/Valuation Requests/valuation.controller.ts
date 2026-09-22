import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, valuationService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const ValuationController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = valuationService;

  try {
    switch (request.method) {
      case "GET": {
        const viewUser = await Authorized(request, "View valuation request");

        const valuationId = pathnames[2],
          result = valuationId
            ? await service.getValuationRequest(valuationId, viewUser)
            : await service.getValuationRequests(viewUser);

        sendResponseMessage(200, false, result, response);
        break;
      }
      case "POST": {
        // Public "get a valuation" form — visitors submitting requests are never logged in.
        const postRequestBody: any = await getRequestBody(request),
          newValuationRequest =
            await service.createValuationRequest(postRequestBody);

        sendResponseMessage(201, false, newValuationRequest, response);
        break;
      }
      case "PATCH": {
        const user = await Authorized(request, "Edit valuation request"),
          patchValuationId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedValuationRequest = await service.editValuationRequest(
            patchValuationId,
            patchRequestBody,
            user,
          );

        await logService.createLog({
          action: "Valuation request update",
          entity_id: patchedValuationRequest.id,
          entity_type: "Valuation Request",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedValuationRequest,
        });

        sendResponseMessage(200, false, patchedValuationRequest, response);
        break;
      }
      case "DELETE": {
        const user = await Authorized(request, "Delete valuation request"),
          deleteValuationId = PathnameValidator(pathnames);

        await service.deleteValuationRequest(deleteValuationId, user);

        await logService.createLog({
          action: "Valuation deletion",
          entity_id: deleteValuationId,
          entity_type: "Valuation Request",
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
