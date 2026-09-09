import type { IncomingMessage, ServerResponse } from "node:http";
import { insightViewService } from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getRequestBody,
  sendResponseMessage,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";

export const InsightViewController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const service = insightViewService;

  try {
    switch (request.method) {
      case "GET":
        // Any authenticated staff member can view pageview analytics — no dedicated
        // permission exists for this yet, unlike Operations/Listing Views' "View listing".
        await AuthToken(request);

        const views = await service.getViews();

        sendResponseMessage(200, false, views, response);
        break;
      case "POST":
        // Public anonymous tracking beacon — readers browsing insights are never logged in.
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
