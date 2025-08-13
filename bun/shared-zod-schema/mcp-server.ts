import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AddInput, AddOutput, type TAddInput } from "./schemas.js";

// TODO Use the actual server2 here..

const server = new McpServer({
    name: "NumberAdder Example",
    version: "1.0.0",
    description: "A simple Bun server using shared Zod schemas to add two numbers.",
    port: 3000,
});

server.registerTool(
    "add_numbers",
    {
        title: "Add Two Numbers",
        description: "Adds two numbers together and returns the result.",
        inputSchema: AddInput.shape,
        outputSchema: AddOutput.shape,
    },
    async (input: TAddInput) => {
        const payload = {
            sum: input.a + input.b,
        };
        const out = AddOutput.parse(payload);
        return { content: [{ type: "json", json: out }] };
    }
);


server.connect();

