import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, redirectService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";

export const RedirectController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = redirectService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const redirects = await service.getRedirects();

        sendResponseMessage(200, false, redirects, response);
        break;
      case "POST":
        const postRequestBody: any = await getRequestBody(request),
          newRedirect = await service.createRedirect(postRequestBody);

        await logService.createLog({
          action: "Redirect creation",
          entity_id: newRedirect.id,
          entity_type: "Redirect",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newRedirect,
        });

        sendResponseMessage(201, false, newRedirect, response);
        break;
      case "PATCH":
        const patchRedirectId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedRedirect = await service.editRedirect(
            patchRedirectId,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Redirect update",
          entity_id: patchedRedirect.id,
          entity_type: "Redirect",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedRedirect,
        });

        sendResponseMessage(200, false, patchedRedirect, response);
        break;
      case "DELETE":
        const deleteRedirectId = PathnameValidator(pathnames);

        await service.deleteRedirect(deleteRedirectId);

        await logService.createLog({
          action: "Redirect deletion",
          entity_id: deleteRedirectId,
          entity_type: "Redirect",
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
