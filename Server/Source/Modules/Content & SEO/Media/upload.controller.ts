import type { IncomingMessage, ServerResponse } from "node:http";
import { v2 as cloudinary } from "cloudinary";
import {
  ErrorFormatter,
  getRequestBody,
  sendResponseMessage,
} from "../../../Utilities/Http.js";
import {
  Authorized,
  type permission_group,
} from "../../../Middleware/Authorization.js";
import { AuthToken } from "../../../Middleware/Authentication.js";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../../../../Configurations/Env.js";

/**
 * Signs direct-to-Cloudinary uploads rather than proxying image bytes
 * through this server. The client uploads straight to Cloudinary using the
 * signature this issues; only a session holding the relevant "Create …"
 * permission for the given context ever gets one, so an anonymous visitor
 * can never obtain a valid signature of their own — Cloudinary itself
 * refuses any upload whose params don't match it.
 */
type UploadContext = "insight" | "service" | "listing" | "agent";

const CONTEXT_FOLDER: Record<UploadContext, string> = {
  insight: "insights/covers",
  service: "services/covers",
  listing: "listings/photos",
  agent: "agents/photos",
};

// "agent" has no fine-grained permission of its own yet — editing an agent
// profile (agent.controller.ts PATCH) only requires being signed in at all,
// so a photo upload for that same profile is gated the same way rather than
// invented a permission nothing has been granted for.
const CONTEXT_PERMISSION: Record<
  Exclude<UploadContext, "agent">,
  permission_group
> = {
  insight: "Create insight",
  service: "Create service",
  listing: "Create listing",
};

export const UploadController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  try {
    switch (request.method) {
      case "POST": {
        const body = await getRequestBody(request),
          context: UploadContext =
            body.context === "service" ||
            body.context === "listing" ||
            body.context === "agent"
              ? body.context
              : "insight";

        if (context === "agent") await AuthToken(request);
        else await Authorized(request, CONTEXT_PERMISSION[context]);

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
          sendResponseMessage(
            503,
            true,
            "Image uploads aren't configured on this server yet",
            response,
          );
          break;
        }

        const folder = CONTEXT_FOLDER[context],
          timestamp = Math.round(Date.now() / 1000),
          signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            CLOUDINARY_API_SECRET,
          );

        sendResponseMessage(
          200,
          false,
          {
            timestamp,
            signature,
            folder,
            apiKey: CLOUDINARY_API_KEY,
            cloudName: CLOUDINARY_CLOUD_NAME,
          },
          response,
        );
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
