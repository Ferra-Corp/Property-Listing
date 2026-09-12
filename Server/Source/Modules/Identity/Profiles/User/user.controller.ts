import type { IncomingMessage, ServerResponse } from "node:http";
import {
  agentService,
  authService,
  logService,
  userService,
} from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";
import { Authorized } from "../../../../Middleware/Authorization.js";
import { InviteAgent } from "../../../../Utilities/Mail.js";
import { REDIRECT_LINK } from "../../../../../Configurations/Env.js";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const UserController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = userService;

  try {
    const user = await AuthToken(request);

    switch (request.method) {
      case "GET":
        const userId = pathnames[2],
          result = userId
            ? await service.getUser(userId)
            : await service.getUsers();

        sendResponseMessage(200, false, result, response);
        break;
      case "POST": {
        await Authorized(request, "Invite users");

        const postRequestBody: any = await getRequestBody(request),
          password_hash = await authService.generateRandomPasswordHash(),
          newUser = await service.createUser({
            ...postRequestBody,
            password_hash,
          });

        await logService.createLog({
          action: "User invite",
          entity_id: newUser.id,
          entity_type: "User",
          user_id: newUser.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newUser,
        });

        if (newUser.role == "agent") {
          const newAgentProfile = await agentService.createAgentProfile({
            user_id: newUser.id,
            display_name: newUser.name,
            slug: slugify(newUser.name),
          });

          await logService.createLog({
            action: "Agent profile creation",
            entity_id: newAgentProfile.id,
            entity_type: "Agent Profile",
            user_id: newUser.id,
            user_agent: userAgent.deviceName,
            ip_address: userAgent.ipAddress,
            changes: newAgentProfile,
          });
        }

        const setupToken = await authService.createPasswordSetupToken(
          newUser.id,
        );

        await InviteAgent(
          newUser.email,
          `${REDIRECT_LINK}/invite?token=${setupToken}`,
        );

        sendResponseMessage(201, false, newUser, response);
        break;
      }
      case "PATCH":
        const patchUserId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request);

        if (patchRequestBody.role)
          await Authorized(request, "Manage user roles");

        const patchedUser = await service.editUser(
          patchUserId,
          patchRequestBody,
        );

        await logService.createLog({
          action: "User update",
          entity_id: patchedUser.id,
          entity_type: "User",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedUser,
        });

        sendResponseMessage(200, false, patchedUser, response);
        break;
      case "DELETE":
        await Authorized(request, "Delete users");

        const deleteUserId = PathnameValidator(pathnames);

        await service.deleteUser(deleteUserId);

        await logService.createLog({
          action: "User deletion",
          entity_id: deleteUserId,
          entity_type: "User",
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
