import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, mediaService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";

export const MediaController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = mediaService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const media = await service.getMedia();

        sendResponseMessage(200, false, media, response);
        break;
      case "POST":
        const postRequestBody: any = await getRequestBody(request),
          newMedia = await service.createMedia(postRequestBody);

        await logService.createLog({
          action: "Listing media creation",
          entity_id: newMedia.id,
          entity_type: "Listing Media",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newMedia,
        });

        sendResponseMessage(201, false, newMedia, response);
        break;
      case "PATCH":
        const patchMediaId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedMedia = await service.editMedia(
            patchMediaId,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Listing media update",
          entity_id: patchedMedia.id,
          entity_type: "Listing Media",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedMedia,
        });

        sendResponseMessage(200, false, patchedMedia, response);
        break;
      case "DELETE":
        const deleteMediaId = PathnameValidator(pathnames);

        await service.deleteMedia(deleteMediaId);

        await logService.createLog({
          action: "Listing media deletion",
          entity_id: deleteMediaId,
          entity_type: "Listing Media",
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
