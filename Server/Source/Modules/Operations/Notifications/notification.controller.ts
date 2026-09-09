import type { IncomingMessage, ServerResponse } from "node:http";
import {
  logService,
  notificationService,
} from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const NotificationController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = notificationService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const notifications = await service.getNotifications();

        sendResponseMessage(200, false, notifications, response);
        break;
      case "POST":
        await Authorized(request, "Create notification");

        const postRequestBody: any = await getRequestBody(request),
          newNotification =
            await service.createNotification(postRequestBody);

        await logService.createLog({
          action: "Notification creation",
          entity_id: String(newNotification.id),
          entity_type: "Notification",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newNotification,
        });

        sendResponseMessage(201, false, newNotification, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit notification");

        const patchNotificationId = Number(PathnameValidator(pathnames)),
          patchRequestBody = await getRequestBody(request),
          patchedNotification = await service.updateNotification(
            patchNotificationId,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Notification update",
          entity_id: String(patchedNotification.id),
          entity_type: "Notification",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedNotification,
        });

        sendResponseMessage(200, false, patchedNotification, response);
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
