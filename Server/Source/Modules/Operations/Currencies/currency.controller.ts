import type { IncomingMessage, ServerResponse } from "node:http";
import { currencyService, logService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const CurrencyController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = currencyService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const currencies = await service.getCurrencies();

        sendResponseMessage(200, false, currencies, response);
        break;
      case "POST":
        await Authorized(request, "Create currency");

        const postRequestBody: any = await getRequestBody(request),
          newCurrency = await service.createCurrency(postRequestBody);

        await logService.createLog({
          action: "Currency creation",
          entity_id: newCurrency.code,
          entity_type: "Currency",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newCurrency,
        });

        sendResponseMessage(201, false, newCurrency, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit currency");

        const patchCurrencyCode = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchCurrency = await service.editCurrency(
            patchCurrencyCode,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Currency update",
          entity_id: patchCurrency.code,
          entity_type: "Currency",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchCurrency,
        });

        sendResponseMessage(200, false, patchCurrency, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete currency");

        const deleteCurrencyCode = PathnameValidator(pathnames);

        await service.deleteCurrency(deleteCurrencyCode);

        await logService.createLog({
          action: "Currency deletion",
          entity_id: deleteCurrencyCode,
          entity_type: "Currency",
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
