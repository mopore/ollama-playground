import { launchServer } from "./express_helpers";

const PORT = Number(process.env.MCP_PORT ?? 8080);
const HOST = process.env.MCP_HOST ?? "0.0.0.0";

launchServer(HOST, PORT);
