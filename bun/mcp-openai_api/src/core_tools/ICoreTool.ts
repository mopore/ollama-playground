import type { ZodTypeAny } from "zod";
import type { ToolInput, ToolOutput } from "./types";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ICoreTool<I extends ZodTypeAny, O extends ZodTypeAny> {
	toolName: string;
	toolDescription: string;
	toolInputSchema: I;
	toolOutputSchema: O;
	executeTool(input: ToolInput<I>): Promise<ToolOutput<O>>;
	retrieveStoredOutput(): ToolInput<O> | undefined;
	storeOutput(output: ToolOutput<O>): void;
	registerAtMcpServer(server: McpServer): void;
}
