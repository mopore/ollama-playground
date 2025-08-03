import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

/** CLI input: a and b */
const InputSchema = z.object({
    a: z.coerce.number(),
    b: z.coerce.number(),
});
type Input = z.infer<typeof InputSchema>;

/** Endpoint of your MCP server (defaults to your sample’s port/path) */
const MCP_URL = new URL(process.env.MCP_URL || "http://192.168.199.246:8080/mcp/");

/** Minimal CLI parsing: supports `client.ts 3 5` or `client.ts --a 3 --b 5` */
const parseArgs = (argv: string[]): Input => {
    const out: Record<string, unknown> = {};
    for (let i = 0; i < argv.length; i++) {
        const t = argv[i];
        if (t === "--a") out.a = argv[++i];
            else if (t === "--b") out.b = argv[++i];
                else if (out.a === undefined) out.a = t;
                    else if (out.b === undefined) out.b = t;
    }
    return InputSchema.parse({ a: out.a, b: out.b });
};

const main = async () => {
    const { a, b } = parseArgs(process.argv.slice(2));

    const client = new Client({ name: "bun-streamable-http-client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(MCP_URL);

    console.log(`Connecting to MCP server at ${MCP_URL.href} ...`);
    await client.connect(transport);
    console.log("Connected.");

    console.log(`Calling tool: add_numbers(a=${a}, b=${b})`);
    const result = await client.callTool({
        name: "add_numbers",
        arguments: { a, b },
    });

    const text = result?.content?.find((c) => c.type === "text")?.text ?? "";
    console.log(`Result: ${text}`);
};

main().catch((err) => {
    console.error("Client error:", err);
    process.exit(1);
});
