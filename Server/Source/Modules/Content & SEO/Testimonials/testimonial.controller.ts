import type { IncomingMessage, ServerResponse } from "node:http";
import { logService, testimonialService } from "../../../Data Objects/DTO.js";
import {
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  sendResponseMessage,
  PathnameValidator,
} from "../../../Utilities/Http.js";
import { OptionalAuthToken } from "../../../Middleware/Authentication.js";
import { Authorized } from "../../../Middleware/Authorization.js";

export const TestimonialController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean),
    userAgent = await getClientDetails(request);

  const testimonials = testimonialService;

  try {
    switch (request.method) {
      case "GET":
        const viewer = await OptionalAuthToken(request),
          id = pathnames[2],
          result = id
            ? await testimonials.getTestimonial(id, !viewer)
            : await testimonials.getTestimonials(!viewer);

        sendResponseMessage(200, false, result, response);
        break;
      case "POST":
        const postUser = await Authorized(request, "Create testimonial");

        const postRequestBody: any = await getRequestBody(request),
          newTestimonial = await testimonials.createTestimonial(postRequestBody);

        await logService.createLog({
          action: "Testimonial creation",
          entity_id: newTestimonial.id,
          entity_type: "Testimonial",
          user_id: postUser.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: newTestimonial,
        });

        sendResponseMessage(201, false, newTestimonial, response);
        break;
      case "PATCH":
        const patchUser = await Authorized(request, "Edit testimonial");

        const patchId = PathnameValidator(pathnames),
          patchRequestBody = await getRequestBody(request),
          patchedTestimonial = await testimonials.editTestimonial(patchId, patchRequestBody);

        await logService.createLog({
          action: "Testimonial update",
          entity_id: patchedTestimonial.id,
          entity_type: "Testimonial",
          user_id: patchUser.id,
          user_agent: userAgent.deviceName,
          ip_address: userAgent.ipAddress,
          changes: patchedTestimonial,
        });

        sendResponseMessage(200, false, patchedTestimonial, response);
        break;
      case "DELETE":
        const deleteUser = await Authorized(request, "Delete testimonial");

        const deleteId = PathnameValidator(pathnames);

        await testimonials.deleteTestimonial(deleteId);

        await logService.createLog({
          action: "Testimonial deletion",
          entity_id: deleteId,
          entity_type: "Testimonial",
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
