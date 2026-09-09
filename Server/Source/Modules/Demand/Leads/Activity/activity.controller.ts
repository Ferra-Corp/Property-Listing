import type { IncomingMessage, ServerResponse } from "node:http";
import { activityService, logService } from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";

export const ActivityController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = activityService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const leadId = pathnames[2],
          result = leadId
            ? await service.getActivitiesByLead(leadId)
            : await service.getActivities();

        sendResponseMessage(200, false, result, response);
        break;
      case "POST":
        const postRequestBody: any = await getRequestBody(request),
          newActivity = await service.createActivity({
            ...postRequestBody,
            user_id: user.id,
          });

        await logService.createLog({
          action: "Lead activity creation",
          entity_id: newActivity.id,
          entity_type: "Lead Activity",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newActivity,
        });

        sendResponseMessage(201, false, newActivity, response);
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
