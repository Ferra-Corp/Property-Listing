import type { IncomingMessage } from "node:http";
import { authService } from "../Data Objects/DTO.js";
import type { PublicUser } from "../Modules/Identity/Profiles/User/user.types.js";
import { MiddlewareError, ServiceError } from "../Utilities/Http.js";

export const AuthToken = async (
  request: IncomingMessage,
): Promise<PublicUser> => {
  const service = authService;

  try {
    const authenticationToken = request.headers["authorization"];
    if (!authenticationToken)
      throw new MiddlewareError("Authentication token not provided", 401);

    const token = authenticationToken.split(" ")[1];

    if (!token)
      throw new MiddlewareError("Authentication token not provided", 401);

    const user = await service.getCurrentUser(token);

    return user;
  } catch (error) {
    if (error instanceof MiddlewareError) throw error;

    // Preserve a real status the underlying error already carries (e.g. 401
    // for an invalid/expired access token) instead of collapsing every
    // failure here into a generic 400 — callers like the BFF's session
    // refresh rely on actually getting a 401 back to know when to retry.
    throw new MiddlewareError(
      (error as Error).message,
      error instanceof ServiceError ? error.statusCode : 401,
    );
  }
};

/**
 * Same as `AuthToken`, but for routes a visitor may hit anonymously (e.g. a
 * public listing/insight/agent page) where staff should additionally see
 * unpublished records. Returns `null` instead of throwing when no valid
 * session is present, rather than blocking the request.
 */
export const OptionalAuthToken = async (
  request: IncomingMessage,
): Promise<PublicUser | null> => {
  try {
    return await AuthToken(request);
  } catch {
    return null;
  }
};
