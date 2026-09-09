import type { IncomingMessage, ServerResponse } from "node:http";
import { logService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  sendResponseMessage,
} from "../../../Utilities/Http.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const AuditController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const service = logService;

  try {
    const requestMethod = request.method;

    switch (requestMethod) {
      case "GET":
        await Authorized(request, "View logs");

        const logs = await service.getLogs();

        sendResponseMessage(200, false, logs, response);
        break;
      default:
        sendResponseMessage(
          405,
          true,
          "Invalid HTTP header route used",
          response,
        );
        break;
    }
  } catch (error) {
    const { statusCode, message } = ErrorFormatter(error as Error);

    sendResponseMessage(statusCode, true, message, response);
  }
};
