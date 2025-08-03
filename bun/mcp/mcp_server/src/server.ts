import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";


const InputSchema = z.object({
    a: z.number(),
    b: z.number(),
});

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
            return {
                content: [{ type: "text", text: String(result) }],
            }
        }
    );

    // Resource: fixed file path (content is static for the example)
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
}

// ---- 2) Stateless Streamable HTTP over Node's http (works on Bun) ----
// One transport/server per request -> simplest shape, no sessions/SSE
const handleMcpPost = async (req: IncomingMessage, res: ServerResponse) => {
    try {
        const body = await readJson(req);
        const server = buildServer();
        const transport = new StreamableHTTPServerTransport({
            // undefined => stateless mode (no session, no SSE)
            sessionIdGenerator: undefined,
        });

        // Clean up when the client disconnects
        res.on("close", () => {
            transport.close();
            server.close();
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, body);
    } catch (err) {
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
}

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
}

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
}

const readJson = (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let data = "";
        req.setEncoding("utf8");
        req
            .on("data", (chunk) => (data += chunk))
            .on("end", () => {
                try {
                    resolve(data ? JSON.parse(data) : undefined);
                } catch (e) {
                    reject(e);
                }
            })
            .on("error", reject);
    });
}

// ---- 3) Start HTTP server (Bun runs this just fine) ----
const PORT = Number(process.env.MCP_PORT || 8080);

const isMcpEndpoint = (p: string) => p === "/mcp" || p === "/mcp/";

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (!isMcpEndpoint(url.pathname)) return notFound(res);

    if (req.method === "POST") {
        await handleMcpPost(req, res);
    } else if (req.method === "GET" || req.method === "DELETE") {
        // Stateless mode: explicitly say not allowed (per spec this is OK)
        methodNotAllowed(res);
    } else {
        methodNotAllowed(res);
    }
});

server.listen(PORT)
    .on("listening", () => {
        console.log(`MCP Streamable HTTP server listening on http://localhost:${PORT}/mcp`);
    })
    .on("error", (err) => {
        console.error("Server error:", err);
        process.exit(1);
    });
