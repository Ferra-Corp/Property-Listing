import type { IncomingMessage, ServerResponse } from "node:http";
import { Routes } from "./Routes.js";
import { sendResponseMessage } from "./Source/Utilities/Http.js";
import { REDIRECT_LINK } from "./Configurations/Env.js";

const Router = (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  try {
    const requestUrl: URL = new URL(
        request.url!,
        `http://${request.headers.host}`,
      ),
      pathnames: string[] = requestUrl.pathname.split("/").filter(Boolean);

    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,OPTIONS,DELETE",
    );
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Origin", `${REDIRECT_LINK}`);
    response.setHeader(
      "Access-Control-Allow-Headers",
      "accept,content-type,content-length",
    );

    if (request.method == "OPTIONS")
      return sendResponseMessage(204, false, "", response);

    let routeFound: boolean = false;

    Routes.forEach((route) => {
      if (route.name.toLowerCase() == pathnames.at(1)) {
        routeFound = true;
        route.controller(request, response);
        return;
      }
    });

    if (!routeFound)
      return sendResponseMessage(404, true, "Invalid api route", response);
  } catch (error) {
    return sendResponseMessage(
      500,
      true,
      `API Error: ${(error as Error).message}`,
      response,
    );
  }
};

export default Router;
