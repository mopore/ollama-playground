import { z } from "zod";
import type { ToolInput, ToolOutput } from "./types";
import type { ICoreTool } from "./ICoreTool"; 
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";


export const AddNumbersInputSchema = z.object({
	a: z.coerce.number().describe("The first number to add"),
	b: z.coerce.number().describe("The second number to add"),
});

export const AddNumbersOutputSchema = z.object({
	input: AddNumbersInputSchema,
	output: z.coerce.number().describe("The sum of a and b"),
});

export type AddNumbersInput = ToolInput<typeof AddNumbersInputSchema>;

export type AddNumbersOutput = ToolOutput<typeof AddNumbersOutputSchema>;


export class AddNumbersCoreTool implements ICoreTool<typeof AddNumbersInputSchema, typeof AddNumbersOutputSchema> {

	private readonly _toolName = "add_numbers";
	private readonly _toolDescription = "A tool to add two numbers together.";
	private o: AddNumbersOutput | undefined;

	public readonly toolInputSchema = AddNumbersInputSchema;
	public readonly toolOutputSchema = AddNumbersOutputSchema;

	public get toolName(): string {
		return this._toolName;
	}

	get toolDescription(): string{
		return this._toolDescription;
	}

	executeTool(i: AddNumbersInput): Promise<AddNumbersOutput> {
		const result = i.a + i.b;
		console.log(`AddNumbersCoreTool.executeTool: add_numbers(${i.a}, ${i.b}) = ${result}`);
		const output: AddNumbersOutput = {
			input: i,
			output: result,
		};
		return Promise.resolve(output);
	}

	storeOutput(o: AddNumbersOutput): void {
		this.o = o;
	}

	retrieveStoredOutput(): AddNumbersOutput | undefined {
		return this.o;
	}

	registerAtMcpServer(server: McpServer): void {
		server.registerTool(
			this.toolName,
			{
				title: this.toolName,
				description: this.toolDescription,
				inputSchema: AddNumbersInputSchema.shape,
			},
			async (i: AddNumbersInput) => {
				console.log("Entering MCP context");
				const o: AddNumbersOutput = await this.executeTool(i);
				const oJson = JSON.stringify(o, null, 2);
				console.log("Leaving MCP context");
				return { 
					content: [{ type: "text", text: oJson }],
					"structuredContent": JSON.parse(oJson)
				}
			}
		);
	}
}

