import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./mcp_helpers";

const transports: Record<string, StreamableHTTPServerTransport> = {};

// --- tiny request logger (method, path, headers of interest, jsonrpc method/id)
const logReq = (req: express.Request) => {
  const sid = (req.headers["mcp-session-id"] as string) || "-";
  const acc = req.headers["accept"] || "-";
  const ct = req.headers["content-type"] || "-";
  const m = (req.body && (req.body.method as string)) || "-";
  const id = (req.body && (req.body.id as number | string)) ?? "-";
  console.log(
    `[HTTP] ${req.method} ${req.originalUrl} ` +
      `sid=${sid} accept="${acc}" content-type="${ct}" jsonrpc.method=${m} id=${id}`
  );
};


const handleGetHealth: express.RequestHandler = (req: Request, res: Response) => {
  logReq(req);
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

const handlePost: express.RequestHandler = async (req, res) => {
  logReq(req);

  const sessionId = (req.headers["mcp-session-id"] as string | undefined) ?? undefined;
  const body = req.body ?? {};
  const isInit = typeof body?.method === "string" && body.method === "initialize";

  try {
    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInit) {
      console.log("[MCP] creating transport for new session…");
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.log(`[MCP] session initialized: ${sid}`);
          transports[sid] = transport!;
        },
      });

      transport.onclose = () => {
        const sid = transport?.sessionId;
        console.log(`[MCP] session closed: ${sid ?? "?"}`);
        if (sid) delete transports[sid];
      };

      const server = buildServer();
      await server.connect(transport);
      console.log("[MCP] server connected to transport");
    } else {
      console.warn("[MCP] rejecting request: missing/unknown session and not initialize");
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, body);
  } catch (err) {
    console.error("MCP POST error:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  }
};

const handleGetOrDelete: express.RequestHandler = async (req, res) => {
  logReq(req);
  const sessionId = (req.headers["mcp-session-id"] as string | undefined) ?? undefined;
  if (!sessionId || !transports[sessionId]) {
    console.warn("[MCP] GET/DELETE with invalid or missing session ID");
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (err) {
    console.error("MCP GET/DELETE error:", err);
    if (!res.headersSent) res.status(500).send("Internal error");
  }
};

export const launchServer = (host: string, port: number) => {
  const app = express();
  app.use(express.json());
  app.post("/mcp", handlePost);
  app.post("/mcp/", handlePost);
  app.get("/mcp", handleGetOrDelete);
  app.get("/mcp/", handleGetOrDelete);
  app.delete("/mcp", handleGetOrDelete);
  app.delete("/mcp/", handleGetOrDelete);
  app.get("/health", handleGetHealth);

  app.listen(port, host, () => {
    console.log(`[MCP] server on http://${host}:${port}/mcp/`);
  });
}
