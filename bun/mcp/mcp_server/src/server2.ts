// server.ts
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * Construct the MCP server with exactly:
 *  - one "hello world" resource
 *  - one "add_numbers" tool
 */
const buildServer = () => {
  const server = new McpServer({ name: "minimal-streamable-http", version: "1.0.0" });

  // Resource: static "hello world"
  server.registerResource(
    "hello",
    "local://hello",
    { title: "Hello", description: "A single text resource", mimeType: "text/plain" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: "hello world" }],
    })
  );

  // Tool: add_numbers(a, b) -> text(sum)
  server.registerTool(
    "add_numbers",
    {
      title: "Add Numbers",
      description: "Add two numbers and return the sum as text",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }],
    })
  );

  return server;
};

/**
 * Very small Express wrapper around Streamable HTTP transport.
 * - Maintains a map of transports by MCP session id
 * - Handles POST/GET/DELETE on /mcp(/)
 * - No CORS/auth;
 */
const PORT = Number(process.env.MCP_PORT ?? 8080);
const HOST = process.env.MCP_HOST ?? "0.0.0.0";

const app = express();
app.use(express.json());

const transports: Record<string, StreamableHTTPServerTransport> = {};

const handlePost: express.RequestHandler = async (req, res) => {

  const sessionId = (req.headers["mcp-session-id"] as string | undefined) ?? undefined;
  const body = req.body ?? {};
  const isInit = typeof body?.method === "string" && body.method === "initialize";

  try {
    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId && transports[sessionId]) {
      // Existing session
      transport = transports[sessionId];
    } else if (!sessionId && isInit) {
      // New session: create transport first, connect, then handle the request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport!;
        },
      });

      // Clean up when the transport closes
      transport.onclose = () => {
        const sid = transport?.sessionId;
        if (sid) delete transports[sid];
      };

      const server = buildServer();
      await server.connect(transport);
    } else {
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
  const sessionId = (req.headers["mcp-session-id"] as string | undefined) ?? undefined;
  if (!sessionId || !transports[sessionId]) {
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

// Support both /mcp and /mcp/ (client defaults to trailing slash)
app.post("/mcp", handlePost);
app.post("/mcp/", handlePost);
app.get("/mcp", handleGetOrDelete);
app.get("/mcp/", handleGetOrDelete);       // SSE notifications (if any)
app.delete("/mcp", handleGetOrDelete);     // terminate session
app.delete("/mcp/", handleGetOrDelete);

app.listen(PORT, HOST, () => {
  console.log(`MCP Streamable HTTP server on http://${HOST}:${PORT}/mcp/`);
});

