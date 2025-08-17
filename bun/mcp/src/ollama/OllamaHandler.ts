import { Ollama, type Message, type Tool } from "ollama";
import type { ZodTypeAny } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { IOllamaConfig } from "./IOllamaConfig";
import type { ICoreTool } from "../core_tools/ICoreTool";

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
    let usedToolName: string | undefined;
    const ollama = new Ollama({ host: this._c.host });
    const messages = this.createInitialMessage(taskDescription);
    const toolDefinitions = this.createToolDefinitions();

    console.log(`OllamaHandler: Requesting initial response...`);
    let response = await ollama.chat({
      model: this._c.model,
      messages,
      tools: toolDefinitions,
    });

    const toolCallRequested = response.message.tool_calls !== undefined && 
      response.message.tool_calls.length > 0
    if (toolCallRequested) {
      const toolCalls = response.message.tool_calls ?? [];
      for (const call of toolCalls) {
	const requestedToolName = call.function.name;
	const toolCall = this._tmap.get(requestedToolName);
	if (toolCall !== undefined) {
	  console.log(`OllamaHandler: Tool "${requestedToolName}" requested by model.`);
	  const inRaw = (call.function as any).arguments;
	  const inParsed = typeof inRaw === "string" ? JSON.parse(inRaw) : inRaw ?? {};
	  const toolInput = toolCall.toolInputSchema.parse(inParsed); // validate + coerce with zod

	  const toolOutput = await toolCall.executeTool(toolInput);
	  toolCall.storeOutput(toolOutput); // store the output for later retrieval

	  console.log(`OllamaHandler: Passing tool response to model...`);
	  const respAfterToolCall = await ollama.chat({
	    model: this._c.model,
	    // format: "json",
	    stream: false,
	    messages: [
	      ...messages,
	      response.message,
	      {
		role: "tool",
		tool_name: toolCall.toolName,
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
	  throw new Error(`OllamaHandler: Unexpected tool call: ${call.function.name}`);
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




