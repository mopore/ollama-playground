// server.ts (verbose logging)
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const buildServer = () => {
  const server = new McpServer({ name: "minimal-streamable-http", version: "1.0.0" });

  server.registerResource(
    "hello",
    "local://hello",
    { title: "Hello", description: "A single text resource", mimeType: "text/plain" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: "hello world" }],
    })
  );

  server.registerTool(
    "add_numbers",
    {
      title: "Add Numbers",
      description: "Add two numbers and return the sum as text",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => {
      const sum = a + b;
      console.log(`[MCP] tool add_numbers called with a=${a} b=${b} -> ${sum}`);
      return { content: [{ type: "text", text: String(sum) }] };
    }
  );

  return server;
};

const PORT = Number(process.env.MCP_PORT ?? 8080);
const HOST = process.env.MCP_HOST ?? "0.0.0.0";

const app = express();
app.use(express.json());

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

const transports: Record<string, StreamableHTTPServerTransport> = {};

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

// Support both /mcp and /mcp/
app.post("/mcp", handlePost);
app.post("/mcp/", handlePost);
app.get("/mcp", handleGetOrDelete);
app.get("/mcp/", handleGetOrDelete);
app.delete("/mcp", handleGetOrDelete);
app.delete("/mcp/", handleGetOrDelete);

app.listen(PORT, HOST, () => {
  console.log(`[MCP] minimal server on http://${HOST}:${PORT}/mcp/`);
  console.log(`[MCP] node=${process.version}`);
});

