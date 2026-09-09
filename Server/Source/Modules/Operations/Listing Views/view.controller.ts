import type { IncomingMessage, ServerResponse } from "node:http";
import { viewService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getRequestBody,
  sendResponseMessage,
} from "../../../Utilities/Http.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const ViewController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const service = viewService;

  try {
    switch (request.method) {
      case "GET":
        await Authorized(request, "View listing");

        const views = await service.getViews();

        sendResponseMessage(200, false, views, response);
        break;
      case "POST":
        // Public anonymous tracking beacon — visitors browsing listings are never logged in.
        const postRequestBody: any = await getRequestBody(request),
          newView = await service.createView(postRequestBody);

        sendResponseMessage(201, false, newView, response);
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
