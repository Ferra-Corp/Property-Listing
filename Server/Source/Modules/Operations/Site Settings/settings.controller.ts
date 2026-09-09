import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, settingsService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const SettingsController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = settingsService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const settings = await service.getSettings();

        sendResponseMessage(200, false, settings, response);
        break;
      case "POST":
        await Authorized(request, "Create site setting");

        const postRequestBody: any = await getRequestBody(request),
          newSetting = await service.createSetting({
            ...postRequestBody,
            updated_by: user.id,
          });

        await logService.createLog({
          action: "Site setting creation",
          entity_id: newSetting.key,
          entity_type: "Site Setting",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newSetting,
        });

        sendResponseMessage(201, false, newSetting, response);
        break;
      case "PATCH":
        await Authorized(request, "Edit site setting");

        const patchSettingKey = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedSetting = await service.editSetting(
            patchSettingKey,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Site setting update",
          entity_id: patchedSetting.key,
          entity_type: "Site Setting",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedSetting,
        });

        sendResponseMessage(200, false, patchedSetting, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete site setting");

        const deleteSettingKey = PathnameValidator(pathnames);

        await service.deleteSetting(deleteSettingKey);

        await logService.createLog({
          action: "Site setting deletion",
          entity_id: deleteSettingKey,
          entity_type: "Site Setting",
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
