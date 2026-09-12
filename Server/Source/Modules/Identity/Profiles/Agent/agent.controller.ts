import type { IncomingMessage, ServerResponse } from "node:http";
import { agentService, logService } from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../../Utilities/Http.js";
import {
  AuthToken,
  OptionalAuthToken,
} from "../../../../Middleware/Authentication.js";

export const AgentController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = agentService;

  try {
    switch (request.method) {
      case "GET":
        const viewer = await OptionalAuthToken(request),
          agentId = pathnames[2],
          result = agentId
            ? await service.getAgentProfile(agentId, !viewer)
            : await service.getAgentProfiles(!viewer);

        sendResponseMessage(200, false, result, response);
        break;
      case "PATCH":
        const patchUser = await AuthToken(request);

        const patchAgentId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedAgentProfile = await service.editAgentProfile(
            patchAgentId,
            patchRequestBody,
          );

        await logService.createLog({
          action: "Agent profile update",
          entity_id: patchedAgentProfile.id,
          entity_type: "Agent Profile",
          user_id: patchUser.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedAgentProfile,
        });

        sendResponseMessage(200, false, patchedAgentProfile, response);
        break;
      case "DELETE":
        const deleteUser = await AuthToken(request);

        const deleteAgentId = PathnameValidator(pathnames);

        await service.deleteAgentProfile(deleteAgentId);

        await logService.createLog({
          action: "Agent profile deletion",
          entity_id: deleteAgentId,
          entity_type: "Agent Profile",
          user_id: deleteUser.id,
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
