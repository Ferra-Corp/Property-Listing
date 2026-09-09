import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, tagService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const TagController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = tagService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const tagId = pathnames[2],
          result = tagId
            ? await service.getTag(tagId)
            : await service.getTags();

        sendResponseMessage(200, false, result, response);
        break;
      case "POST":
        await Authorized(request, "Create tag");

        const postRequestBody: any = await getRequestBody(request),
          newTag = await service.createTag(postRequestBody);

        await logService.createLog({
          action: "Tag creation",
          entity_id: newTag.id,
          entity_type: "Tag",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newTag,
        });

        sendResponseMessage(201, false, newTag, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit tag");

        const patchTagId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedTag = await service.editTag(patchTagId, patchRequestBody);

        await logService.createLog({
          action: "Tag update",
          entity_id: patchedTag.id,
          entity_type: "Tag",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedTag,
        });

        sendResponseMessage(200, false, patchedTag, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete tag");

        const deleteTagId = PathnameValidator(pathnames);

        await service.deleteTag(deleteTagId);

        await logService.createLog({
          action: "Tag deletion",
          entity_id: deleteTagId,
          entity_type: "Tag",
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
