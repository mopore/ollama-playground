import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

const InputSchema = z.object({
    a: z.coerce.number(),
    b: z.coerce.number(),
});
type Input = z.infer<typeof InputSchema>;

const input: Input = {
    a: 55,
    b: 24
};

const MCP_URL = new URL("http://127.0.0.1:8080/mcp");

const main = async (): Promise<void> => {

    const client = new Client({ name: "Test-Client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(MCP_URL,
        {
            sessionId: undefined
        }
    );

    console.log(`Connecting to MCP server at ${MCP_URL.href} ...`);
    await client.connect(transport);
    console.log("Connected.");

    console.log(`Calling tool: add_numbers(a=${input.a}, b=${input.b})`);
    const result = await client.callTool({
        name: "add_numbers",
        arguments: { a:input.a, b: input.b },
    });

    const text = result?.content?.find((c) => c.type === "text")?.text ?? "";
    console.log(`Result: ${text}`);
    await client.close();
    console.log("Client closed.");
};

await main().catch((err) => {
    console.error("Client error:", err);
    process.exit(1);
});
