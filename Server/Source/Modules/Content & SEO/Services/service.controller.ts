import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, serviceService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const ServiceController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = serviceService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const id = pathnames[2],
          result = id
            ? await service.getService(id)
            : await service.getServices();

        sendResponseMessage(200, false, result, response);
        break;
      case "POST":
        await Authorized(request, "Create service");

        const postRequestBody: any = await getRequestBody(request),
          newService = await service.createService(postRequestBody);

        await logService.createLog({
          action: "Service creation",
          entity_id: newService.id,
          entity_type: "Service",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newService,
        });

        sendResponseMessage(201, false, newService, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit service");

        const patchId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedService = await service.editService(patchId, patchRequestBody);

        await logService.createLog({
          action: "Service update",
          entity_id: patchedService.id,
          entity_type: "Service",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedService,
        });

        sendResponseMessage(200, false, patchedService, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete service");

        const deleteId = PathnameValidator(pathnames);

        await service.deleteService(deleteId);

        await logService.createLog({
          action: "Service deletion",
          entity_id: deleteId,
          entity_type: "Service",
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
