import { Ollama, type Message, type Tool } from "ollama";
import type { ZodTypeAny } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { ICoreTool } from "../core_tools/ICoreTool";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { IOllamaMcpHostConfig } from "./IOllamaMcpHostConfig";

export class OllamaMcpHost {

	private readonly _tmap: Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>> = new Map();

	constructor(
		private readonly _c: IOllamaMcpHostConfig,
	) {}

	registerTools(toolsMap: Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>>): void {
		for (const [name, tool] of toolsMap) {
			this._tmap.set(name, tool);
		}
	}

	async callOllama(taskDescription: string): Promise<string | undefined> {
		let usedToolName: string | undefined;
		const ollama = new Ollama({ host: this._c.ollamaHost });
		const messages = this.createInitialMessage(taskDescription);
		const toolDefinitions = this.createToolDefinitions();

		console.log(`OllamaMcpHost: Requesting initial response...`);
		let response = await ollama.chat({
			model: this._c.ollamaModel,
			messages,
			tools: toolDefinitions,
		});

		const toolCallRequested = response.message.tool_calls !== undefined && 
			response.message.tool_calls.length > 0
		if (toolCallRequested) {
			const toolCalls = response.message.tool_calls ?? [];
			for (const call of toolCalls) {
				const requestedToolName = call.function.name;
				const coreTool = this._tmap.get(requestedToolName);
				if (coreTool !== undefined) {
					console.log(`OllamaMcpHost: Tool "${requestedToolName}" requested by model.`);

					const inRaw = (call.function as any).arguments;
					const inParsed = typeof inRaw === "string" ? JSON.parse(inRaw) : inRaw ?? {};
					const toolInput = coreTool.toolInputSchema.parse(inParsed); // validate + coerce with zod

					const client = new Client({ name: "bun-streamable-http-client", version: "1.0.0" });
					const mcpServerHostUrl = new URL(this._c.mcpHost);
					const transport = new StreamableHTTPClientTransport(mcpServerHostUrl);

					console.log(`OllamaMcpHost: Connecting to MCP server at ${mcpServerHostUrl.href} ...`);
					await client.connect(transport);
					console.log("OllamaMcpHost: Connected.");

					console.log(`OllamaMcpHost: Calling tool "${coreTool.toolName}" via MCP.`);
					const result = await client.callTool({
						name: coreTool.toolName,
						arguments: toolInput,
					});

					const structuredContent = result?.structuredContent;
					if (structuredContent === undefined) {
						throw new Error("No structured content in result");
					}
					const toolOutput = coreTool.toolOutputSchema.parse(structuredContent);
					coreTool.storeOutput(toolOutput); // store the output for later retrieval

					console.log(`OllamaMcpHost Result: ${JSON.stringify(toolOutput)}`);
					client.close();
					console.log("OllamaMcpHost: MCP Client closed.");

					console.log(`OllamaMcpHost: Passing tool response to Ollama model...`);
					const respAfterToolCall = await ollama.chat({
						model: this._c.ollamaModel,
						// format: "json",
						stream: false,
						messages: [
							...messages,
							response.message,
							{
								role: "tool",
								tool_name: coreTool.toolName,
								content: JSON.stringify(toolOutput),
							},
						],
						options: {
							temperature: 0
						}
					});
					response = respAfterToolCall;
					usedToolName = requestedToolName;
				}
				else {
					throw new Error(`OllamaMcpHost: Unexpected tool call: ${call.function.name}`);
				}
			}
		}
		else {
			throw new Error("Model did not request tool calls.");
		}

		// Since the client has access to the ToolCall objects he can retrieve the
		// output directly instead of parsing the response (see IToolCall.retrieveStoredOutput).
		// Hence we only return the used tool name.
		//
		// Uncomment for debugging purposes:
		// const ollamaResponse = response.message.content;
		// const output = toolCall.toolOutputSchema.parse(JSON.parse(ollamaResponse));
		//
		console.log(`OllamaHandler: Final response from model prepared.`);
		return usedToolName;
	}

	createInitialMessage(taskDescription: string): Message[] {
		let systemMessage = 
			"You are a helpful assistant.\n" +
				"Prefer calling tools for any requested actions and knowledge requests.\n" +
				"Provide your response in JSON.\n" +
				"Use the following JSON schema definitions accordingly to the used tool:\n";

		for (const [toolname, tool] of this._tmap) {
			const outputSchema = tool.toolOutputSchema;
			const respFormat = zodToJsonSchema(outputSchema, {
				name: "ResponseFormat",
				$refStrategy: "none",
			});

			systemMessage +=
			`\n\nUsed Tool: ${toolname}\n` +
				"```json\n" +
				`${JSON.stringify(respFormat, null, 2)}\n` +
				"```"
		}

		return [
			{
				role: "system" as const,
				content: systemMessage,
			},
			{
				role: "user" as const,
				content: `Fulfill the following task: \n` +
					`<task>\n` +
					`${taskDescription}\n` +
					`</task>`,
			},
		];
	};

	createToolDefinitions(): Tool[] {
		const defs: Tool[] = [];

		for (const [name, tool] of this._tmap) {
			const paramSchema = zodToJsonSchema(tool.toolInputSchema);
			const parsedParamSchema = JSON.parse(JSON.stringify(paramSchema, null, 2));

			// console.log(JSON.stringify(parsedParamSchema, null, 2));

			const def: Tool = {
				type: "function",
				function: {
					name: name,
					description: tool.toolDescription,
					parameters: parsedParamSchema,
				},
			};
			// console.log(`OllamaHandler: Tool definition for "${name}" created.`);
			defs.push(def);
		}
		return defs;
	};
}




