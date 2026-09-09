import type { IncomingMessage } from "node:http";
import { authService } from "../Data Objects/DTO.js";
import type { PublicUser } from "../Modules/Identity/Profiles/User/user.types.js";
import { MiddlewareError } from "../Utilities/Http.js";

export const AuthToken = async (
  request: IncomingMessage,
): Promise<PublicUser> => {
  const service = authService;

  try {
    const authenticationToken = request.headers["authorization"];
    if (!authenticationToken)
      throw new MiddlewareError("Authentication token not provided");

    const token = authenticationToken.split(" ")[1];

    if (!token) throw new MiddlewareError("Authentication token not provided");

    const user = await service.getCurrentUser(token);

    return user;
  } catch (error) {
    throw new MiddlewareError((error as Error).message);
  }
};
