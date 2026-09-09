import type { IncomingMessage, ServerResponse } from "node:http";
import { insightService, logService } from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
  getClientDetails,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";
import { Authorized } from "../../../../Middleware/Authorization.js";

export const InsightController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = insightService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const insightId = pathnames[2],
          result = insightId
            ? await service.getInsight(insightId)
            : await service.getInsights();

        sendResponseMessage(200, false, result, response);
        break;
      case "POST":
        await Authorized(request, "Create insight");

        const postRequestBody: any = await getRequestBody(request),
          newInsight = await service.createInsight(postRequestBody);

        await logService.createLog({
          action: "Insight creation",
          entity_id: newInsight.id,
          entity_type: "Insight",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newInsight,
        });

        sendResponseMessage(201, false, newInsight, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit insight");

        const patchInsightId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedInsight = await service.editInsight(
            patchInsightId,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Insight update",
          entity_id: patchedInsight.id,
          entity_type: "Insight",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedInsight,
        });

        sendResponseMessage(200, false, patchedInsight, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete insight");

        const deleteInsightId = PathnameValidator(pathnames);

        await service.deleteInsight(deleteInsightId);

        await logService.createLog({
          action: "Insight deletion",
          entity_id: deleteInsightId,
          entity_type: "Insight",
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
