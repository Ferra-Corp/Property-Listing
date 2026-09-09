import type { IncomingMessage, ServerResponse } from "node:http";
import { leadService, logService } from "../../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../../Utilities/Http.js";
import { AuthToken } from "../../../../Middleware/Authentication.js";
import { Authorized } from "../../../../Middleware/Authorization.js";

export const LeadController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const service = leadService;

  try {
    switch (request.method) {
      case "GET": {
        await AuthToken(request);

        const leadId = pathnames[2],
          result = leadId
            ? await service.getLead(leadId)
            : await service.getLeads();

        sendResponseMessage(200, false, result, response);
        break;
      }
      case "POST": {
        // Public contact/enquiry form — visitors submitting leads are never logged in.
        const postRequestBody: any = await getRequestBody(request),
          newLead = await service.createLead({
            ...postRequestBody,
            ip_address: userAgent.ipAddress,
            user_agent: userAgent.deviceName,
          });

        sendResponseMessage(201, false, newLead, response);
        break;
      }
      case "PATCH": {
        const user = await Authorized(request, "Edit lead"),
          patchLeadId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedLead = await service.editLead(patchLeadId, patchRequestBody);

        await logService.createLog({
          action: "Lead update",
          entity_id: patchedLead.id,
          entity_type: "Lead",
          user_id: user.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedLead,
        });

        sendResponseMessage(200, false, patchedLead, response);
        break;
      }
      case "DELETE": {
        const user = await Authorized(request, "Delete lead"),
          deleteLeadId = PathnameValidator(pathnames);

        await service.deleteLead(deleteLeadId);

        await logService.createLog({
          action: "Lead deletion",
          entity_id: deleteLeadId,
          entity_type: "Lead",
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
