import type { IncomingMessage, ServerResponse } from "node:http";
import { insightTagService, logService } from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
  ServiceError,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";

export const InsightTagController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = insightTagService;

  try {
    const user = await AuthToken(request);
    const insightId = PathnameValidator(pathnames);

    switch (request.method) {
      case "GET":
        const links = await service.getTagsForInsight(insightId);

        sendResponseMessage(200, false, links, response);
        break;
      case "POST":
        const body: any = await getRequestBody(request),
          newLink = await service.attachTag({
            insight_id: insightId,
            tag_id: body.tag_id,
          });

        await logService.createLog({
          action: "Tag link creation",
          entity_id: newLink.tag_id,
          entity_type: "Insight-Tag link",
          ip_address: userAgent.ipAddress,
          user_agent: userAgent.deviceName,
          user_id: user.id,
          changes: newLink,
        });

        sendResponseMessage(201, false, newLink, response);
        break;
      case "DELETE":
        const tagId = pathnames[3];

        if (!tagId)
          throw new ServiceError("Specify tag id in url segment", 400);

        await service.detachTag(insightId, tagId);

        await logService.createLog({
          action: "Tag link deletion",
          entity_id: tagId,
          entity_type: "Insight-Tag link",
          ip_address: userAgent.ipAddress,
          user_agent: userAgent.deviceName,
          user_id: user.id,
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
