import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, rateService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const RateController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = rateService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const rates = await service.getRates();

        sendResponseMessage(200, false, rates, response);
        break;
      case "POST":
        await Authorized(request, "Create exchange rate");

        const postRequestBody: any = await getRequestBody(request),
          newRate = await service.createRate(postRequestBody);

        await logService.createLog({
          action: "Exchange rate creation",
          entity_id: newRate.id,
          entity_type: "Exchange Rate",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newRate,
        });

        sendResponseMessage(201, false, newRate, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit exchange rate");

        const patchRateId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedRate = await service.editRate(patchRateId, patchRequestBody);

        await logService.createLog({
          action: "Exchange rate update",
          entity_id: patchedRate.id,
          entity_type: "Exchange Rate",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedRate,
        });

        sendResponseMessage(200, false, patchedRate, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete exchange rate");

        const deleteRateId = PathnameValidator(pathnames);

        await service.deleteRate(deleteRateId);

        await logService.createLog({
          action: "Exchange rate deletion",
          entity_id: deleteRateId,
          entity_type: "Exchange Rate",
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
