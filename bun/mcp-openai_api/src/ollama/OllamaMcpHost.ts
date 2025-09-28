import type { ZodTypeAny } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { ICoreTool } from "../core_tools/ICoreTool";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { IOllamaMcpHostConfig } from "./IOllamaMcpHostConfig";
import type { FunctionToolCall } from "openai/resources/beta/threads/runs.mjs";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import OpenAI from "openai";

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

		// 1 - Prepare first call
		const ollama = new OpenAI({ 
			apiKey: "ollama",
			baseURL: `${this._c.ollamaHost}/v1` 
		});
		const messagesForLLM = this.createInitialMessage(taskDescription);
		const toolDefinitions = this.createToolDefinitions();

		console.log(`OllamaMcpHost: Requesting initial response from '${this._c.ollamaHost}' w/ '${this._c.ollamaModel}'...`);
		const firstResponse = await ollama.chat.completions.create({
			model: this._c.ollamaModel,
			messages: messagesForLLM,
			tools: toolDefinitions,
		});

		// 2 - Process first answer (which we assume to be a tool call request
		const firstMessage = firstResponse.choices[0]?.message
		if (firstMessage === undefined) {
			const errMsg = "OllamaMcpHost: No response from the model!"
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		const calls = firstMessage.tool_calls ?? [];
		if (calls.length === 0){
			const errMsg = "OllamaMcpHost: Model did not request any tool calls";
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		if (calls.length > 1){
			const errMsg = "OllamaMcpHost: Model requested more than one tool to call";
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		const call = calls[0];
		if (call === undefined) {
			throw new Error("OllamaMcpHost: 'call' is Unexpectedly undefined");
		}

		if (call.type !== "function"){
			console.error("OllamaMcpHost: No function call!");
			return;
		}
		const fc = call as FunctionToolCall;

		const requestedToolName = fc.function.name;
		const requestedTool = this._tmap.get(requestedToolName);
		if (requestedTool === undefined) {
			const errMsg = `OllamaMcpHost: Could not find a tool with name "${requestedToolName}"`;
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		console.log(`OllamaMcpHost: Tool "${requestedToolName}" requested by model.`);
		// messagesForLLM.push(firstMessage);

		const inRaw = (call.function as any).arguments;
		const inParsed = typeof inRaw === "string" ? JSON.parse(inRaw) : inRaw ?? {};
		const toolInput = requestedTool.toolInputSchema.parse(inParsed); // validate + coerce with zod

		const client = new Client({ name: "bun-streamable-http-client", version: "1.0.0" });
		const mcpServerHostUrl = new URL(this._c.mcpHost);
		const transport = new StreamableHTTPClientTransport(mcpServerHostUrl);

		console.log(`OllamaMcpHost: Connecting to MCP server at ${mcpServerHostUrl.href} ...`);
		await client.connect(transport);
		console.log("OllamaMcpHost: Connected.");

		console.log(`OllamaMcpHost: Calling tool "${requestedTool.toolName}" via MCP.`);
		const result = await client.callTool({
			name: requestedTool.toolName,
			arguments: toolInput,
		});

		const structuredContent = result?.structuredContent;
		if (structuredContent === undefined) {
			throw new Error("No structured content in result");
		}
		const toolOutput = requestedTool.toolOutputSchema.parse(structuredContent);
		requestedTool.storeOutput(toolOutput); // store the output for later retrieval

		console.log(`OllamaMcpHost Result: ${JSON.stringify(toolOutput)}`);
		client.close();
		console.log("OllamaMcpHost: MCP Client closed.");

		// 			console.log(`OllamaMcpHost: Passing tool response to Ollama model...`);
		// 			const respAfterToolCall = await ollama.chat({
		// 				model: this._c.ollamaModel,
		// 				// format: "json",
		// 				stream: false,
		// 				messages: [
		// 					...messagesForLLM,
		// 					response.message,
		// 					{
		// 						role: "tool",
		// 						tool_name: coreTool.toolName,
		// 						content: JSON.stringify(toolOutput),
		// 					},
		// 				],
		// 				options: {
		// 					temperature: 0
		// 				}
		// 			});
		// 			response = respAfterToolCall;
		// 			usedToolName = requestedToolName;
		// 		}
		// 		else {
		// 			throw new Error(`OllamaMcpHost: Unexpected tool call: ${call.function.name}`);
		// 		}
		// 	}
		// }
		// else {
		// 	throw new Error("Model did not request tool calls.");
		// }
		//
		// Since the client has access to the ToolCall objects he can retrieve the
		// output directly instead of parsing the response (see IToolCall.retrieveStoredOutput).
		// Hence we only return the used tool name.
		//
		// Uncomment for debugging purposes:
		// const ollamaResponse = response.message.content;
		// const output = toolCall.toolOutputSchema.parse(JSON.parse(ollamaResponse));
		//
		console.log(`OllamaMcpHost: Final response from model prepared.`);
		return requestedToolName;
	}

	createInitialMessage(taskDescription: string): ChatCompletionMessageParam[] {
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

	createToolDefinitions(): ChatCompletionTool[] {
		const defs: ChatCompletionTool[] = [];

		for (const [name, tool] of this._tmap) {
			const paramSchema = zodToJsonSchema(tool.toolInputSchema);
			const parsedParamSchema = JSON.parse(JSON.stringify(paramSchema, null, 2));

			// console.log(JSON.stringify(parsedParamSchema, null, 2));

			const def: ChatCompletionTool = {
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
