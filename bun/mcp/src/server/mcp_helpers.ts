import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools  } from "../AllTools";

export const buildServer = (): McpServer => {
  const server = new McpServer({ name: "minimal-streamable-http", version: "1.0.0" });

  server.registerResource(
    "hello",
    "local://hello",
    { title: "Hello", description: "A single text resource", mimeType: "text/plain" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: "hello world" }],
    })
  );

  // FIXME Creat a generic approach to register the MCP tools
  //
  // There is an issue with the callback function which somehow nee to match
  // with the InputSchema.
  // The current workaroung is to provide the whole registration by the concrete
  // tool implementation.
  //
  const toolNames = allTools.getAllNames();
  for (const toolName of toolNames) {
    const tool = allTools.getTool(toolName);
    tool.registerAtMcpServer(server);
  }

  return server;
};
