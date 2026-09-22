import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, subscriberService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const SubscriberController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  try {
    switch (request.method) {
      case "GET": {
        // The one-click unsubscribe link sent in every listing alert —
        // public by design, the id itself (an unguessable UUID) is the
        // only credential it needs. Kept as a query param rather than a
        // path segment so admin's path-addressed PATCH/DELETE below never
        // collide with it.
        const unsubscribeId = requestUrl.searchParams.get("id");

        if (unsubscribeId) {
          await subscriberService.unsubscribe(unsubscribeId);

          sendResponseMessage(200, false, "Unsubscribed", response);
          break;
        }

        // Admin subscriber list — Editor and Admin only; a newsletter is a
        // marketing artifact, not Agent's or Viewer's concern.
        await Authorized(request, "View subscriber");

        const subscribers = await subscriberService.getSubscribers();

        sendResponseMessage(200, false, subscribers, response);
        break;
      }
      case "POST": {
        // Public "new listings by email" form on the homepage footer — no
        // session, anyone can sign up.
        const body: any = await getRequestBody(request);

        await subscriberService.subscribe(body);

        sendResponseMessage(201, false, "Subscribed", response);
        break;
      }
      case "PATCH": {
        const user = await Authorized(request, "Edit subscriber"),
          patchId = PathnameValidator(pathnames),
          patchBody = await getRequestBody(request),
          patchedSubscriber = await subscriberService.editSubscriber(
            patchId,
            patchBody,
          );

        await logService.createLog({
          action: "Subscriber update",
          entity_id: patchedSubscriber.id,
          entity_type: "Subscriber",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedSubscriber,
        });

        sendResponseMessage(200, false, patchedSubscriber, response);
        break;
      }
      case "DELETE": {
        const user = await Authorized(request, "Delete subscriber"),
          deleteId = PathnameValidator(pathnames);

        await subscriberService.deleteSubscriber(deleteId);

        await logService.createLog({
          action: "Subscriber deletion",
          entity_id: deleteId,
          entity_type: "Subscriber",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: {},
        });

        sendResponseMessage(204, false, null, response);
        break;
      }
      default:
        sendResponseMessage(405, true, "Invalid HTTP Header method", response);
        break;
    }
  } catch (error) {
    const { statusCode, message } = ErrorFormatter(error as Error);

    sendResponseMessage(statusCode, true, message, response);
  }
};
