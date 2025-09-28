import type { ZodTypeAny } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { IOllamaConfig } from "./IOllamaConfig";
import type { ICoreTool } from "../core_tools/ICoreTool";
import OpenAI from "openai";
import type { FunctionToolCall } from "openai/resources/beta/threads/runs.mjs";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";

export class OllamaHandler {

	private readonly _tmap: Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>> = new Map();

	constructor(
		private readonly _c: IOllamaConfig,
	) {}

	registerTools(toolsMap: Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>>): void {
		for (const [name, tool] of toolsMap) {
			this._tmap.set(name, tool);
		}
	}

	async callOllama(taskDescription: string): Promise<string | undefined> {

		// 1 - Prepare the first call
		const ollama = new OpenAI({ 
			apiKey: "ollama",
			baseURL: `${this._c.host}/v1` 
		});
		const messagesForLLM = this.createInitialMessage(taskDescription);
		const toolDefinitions = this.createToolDefinitions();

		console.log(`OllamaHandler: Requesting initial response...`);
		const firstResponse = await ollama.chat.completions.create({
			model: this._c.model,
			messages: messagesForLLM,
			tools: toolDefinitions,
		});


		// 2 - Process first answer (which we assume to be a tool call request
		const firstMessage = firstResponse.choices[0]?.message
		if (firstMessage === undefined) {
			const errMsg = "No response from the model!"
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		const calls = firstMessage.tool_calls ?? [];
		if (calls.length === 0){
			const errMsg = "Model did not request any tool calls";
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		if (calls.length > 1){
			const errMsg = "Model requested more than one tool to call";
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		const call = calls[0];
		if (call === undefined) {
			throw new Error("'call' is Unexpectedly undefined");
		}

		if (call.type !== "function"){
			console.error("No function call!");
			return;
		}
		const fc = call as FunctionToolCall;

		const requestedToolName = fc.function.name;
		const requestedTool = this._tmap.get(requestedToolName);
		if (requestedTool === undefined) {
			const errMsg = `Could not find a tool with name "${requestedToolName}"`;
			console.error(errMsg);
			console.trace();
			throw new Error(errMsg);
		}

		console.log(`OllamaHandler: Tool "${requestedToolName}" requested by model.`);
		messagesForLLM.push(firstMessage);


		// 3 - Execute the requested tool call
		const inParsed = JSON.parse(fc.function.arguments);
		const toolInput = requestedTool.toolInputSchema.parse(inParsed); // validate + coerce with zod

		const toolOutput = await requestedTool.executeTool(toolInput);
		requestedTool.storeOutput(toolOutput); // store the output for later retrieval

		// We do not need a final request response cycle...

		// messagesForLLM.push({
		// 	role: "tool",
		// 	tool_call_id: call.id,
		// 	content: JSON.stringify({ toolOutput }),
		// });
		//
		// // 4 - Request final answer from LLM with tool execution result
		// console.log(`OllamaHandler: Passing tool response to model...`);
		// const finalResponse = await client.chat.completions.create({
		// 	model: this._c.model,
		// 	// format: "json",
		// 	stream: false,
		// 	messages: messagesForLLM,
		// 	options: {
		// 		temperature: 0
		// 	}
		// });
		//
		// console.log(`OllamaHandler: Final response from model prepared.`);
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




