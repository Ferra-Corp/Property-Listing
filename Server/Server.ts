import http, { IncomingMessage, ServerResponse } from "http";
import Router from "./Router.js";
import { PORT } from "./Configurations/Env.js";
import { ErrorMsg, Info } from "./Source/Utilities/Logger.js";

const httpServer = http.createServer(
  (request: IncomingMessage, response: ServerResponse<IncomingMessage>) =>
    Router(request, response),
);

httpServer.listen(PORT, () => {
  Info(`Server is up and running at port, ${PORT}`);
});

process.on("uncaughtException", (error) => ErrorMsg(error));
process.on("unhandledRejection", (error) => ErrorMsg(error as Error));
