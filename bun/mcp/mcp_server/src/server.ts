import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const InputSchema = z.object({ a: z.number(), b: z.number() });
type Input = z.infer<typeof InputSchema>;

const buildServer = () => {
    const server = new McpServer(
        { name: "bun-streamable-http-server", version: "1.0.0" },
        { capabilities: { logging: {} } }
    );

    server.registerTool(
        "add_numbers",
        {
            title: "Add two numbers",
            description: "Returns the sum of a and b",
            inputSchema: InputSchema.shape,
        },
        async ({ a, b }: Input) => {
            const result = a + b;
            console.log(`add_numbers called with a=${a}, b=${b}, result=${result}`);
            return { content: [{ type: "text", text: String(result) }] };
        }
    );

    server.registerResource(
        "fixed-file",
        "file:///etc/fixed.txt",
        {
            title: "Fixed File",
            description: "Single fixed resource",
            mimeType: "text/plain",
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    text:
                    "This is the fixed resource at file:///tmp/fixed.txt\n(Edit server code to actually read from disk if you want.)",
                },
            ],
        })
    );

    return server;
};

// --- keep ONE MCP server for all requests (important) ---
const mcpServer = buildServer();

// Accept both /mcp and /mcp/
const isMcpEndpoint = (p: string) => p === "/mcp" || p === "/mcp/";

// Basic JSON reader with small log
const readJson = (req: IncomingMessage): Promise<any> =>
    new Promise((resolve, reject) => {
        let data = "";
        req.setEncoding("utf8");
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => {
            try {
                const body = data ? JSON.parse(data) : undefined;
                if (body?.method) {
                    console.log(`HTTP ${req.method} ${req.url} -> ${body.method}`);
                } else {
                    console.log(`HTTP ${req.method} ${req.url}`);
                }
                resolve(body);
            } catch (e) {
                reject(e);
            }
        });
        req.on("error", reject);
    });

const methodNotAllowed = (res: ServerResponse) => {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Method not allowed." },
            id: null,
        })
    );
};

const notFound = (res: ServerResponse) => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32004, message: "Not found." },
            id: null,
        })
    );
};

// Stateless Streamable HTTP: new transport per POST, shared MCP server
const handleMcpPost = async (req: IncomingMessage, res: ServerResponse) => {
    try {
        const body = await readJson(req);
        const transport = new StreamableHTTPServerTransport({
            // undefined => stateless mode (no session, no SSE)
            sessionIdGenerator: undefined,
        });

        // Close only the transport when response closes; DO NOT close the server
        res.on("close", () => transport.close());

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, body);
    } catch (err) {
        console.error("handleMcpPost error:", err);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
                JSON.stringify({
                    jsonrpc: "2.0",
                    error: { code: -32603, message: "Internal server error" },
                    id: null,
                })
            );
        }
    }
};

const PORT = Number(process.env.MCP_PORT || 8080);
const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // Simple health endpoint for Docker
    if (url.pathname === "/health") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("ok");
        return;
    }

    if (!isMcpEndpoint(url.pathname)) return notFound(res);

    if (req.method === "POST") {
        await handleMcpPost(req, res);
    } else if (req.method === "GET" || req.method === "DELETE") {
        // Stateless mode: 405 is correct when no SSE or session termination
        methodNotAllowed(res);
    } else {
        methodNotAllowed(res);
    }
});

// Bind to all interfaces inside Docker
server
    .listen(PORT, "0.0.0.0")
    .on("listening", () => {
        console.log(
            `MCP Streamable HTTP server listening on http://0.0.0.0:${PORT}/mcp`
        );
    })
    .on("error", (err) => {
        console.error("Server error:", err);
        process.exit(1);
    });
