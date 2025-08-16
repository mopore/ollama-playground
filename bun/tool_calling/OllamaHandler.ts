import { Ollama, type Message, type Tool } from "ollama";
import type { ZodTypeAny } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type { IOllamaToolCall } from "./IOllamaToolCall";

export class OllamaHandler {
  constructor(
    private host: string,
    private readonly model: string,
  ) {}

  async callOllama<I extends ZodTypeAny,O extends ZodTypeAny>(
    toolCall: IOllamaToolCall<I, O>,
  ): Promise<O> {

    const ollama = new Ollama({ host: this.host });
    const messages = createInitialMessage(
      toolCall.task, 
      toolCall.toolOutputSchema,
    );
    console.log(`OllamaHandler: Requesting initial response...`);

    const createdTool = createTool({
      name: toolCall.toolName,
      description: toolCall.task,
      input: toolCall.toolInputSchema,
      output: toolCall.toolOutputSchema,
    });
    let response = await ollama.chat({
      model: this.model,
      messages,
      tools: [createdTool],
    });

    const toolCallRequested = response.message.tool_calls !== undefined && 
      response.message.tool_calls.length > 0
    if (toolCallRequested) {
      console.log("OllamaHandler: Model requested tool calls:");
      const toolCalls = response.message.tool_calls ?? [];
      for (const call of toolCalls) {
	if (call.function.name === toolCall.toolName) {
	  const inRaw = (call.function as any).arguments;
	  const inParsed = typeof inRaw === "string" ? JSON.parse(inRaw) : inRaw ?? {};
	  const toolInput = toolCall.toolInputSchema.parse(inParsed); // validate + coerce with zod

	  const toolOutput = await toolCall.executeImpl(toolInput);

	  console.log(`OllamaHandler: Requesting response after tool called...`);
	  const respAfterToolCall = await ollama.chat({
	    model: this.model,
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
	}
	else {
	  throw new Error(`OllamaHandler: Unexpected tool call: ${call.function.name}`);
	}
      }
    }
    else {
      throw new Error("Model did not request tool calls.");
    }

    const ollamaResponse = response.message.content;
    const output = toolCall.toolOutputSchema.parse(JSON.parse(ollamaResponse));
    return output;
  }

}


/**
 * Create an Ollama Tool definition from Zod schema
 */
export const createTool = <I extends ZodTypeAny, O extends ZodTypeAny>(opts: {
  name: string;
  description: string;
  input: I;
  output: O;
}): Tool => {
  const paramSchema = zodToJsonSchema(opts.input);
  const parsedParamSchema = JSON.parse(JSON.stringify(paramSchema, null, 2));
  // console.log(JSON.stringify(parsedParamSchema, null, 2));

  return {
    type: "function",
    function: {
      name: opts.name,
      description: opts.description,
      parameters: parsedParamSchema,
    },
  };
};


const createInitialMessage = <O extends ZodTypeAny>(
  task: string,
  outputSchema: O,
): Message[] => {
  const respFormat = zodToJsonSchema(outputSchema, {
    name: "ResponseFormat",
    $refStrategy: "none",
  });

  return [
    {
      role: "system" as const,
      content:
	"You are a helpful assistant.\n" +
	"Prefer calling tools for any requested actions and knowledge requests.\n" +
	"Provide your response in JSON.\n" +
	"Use the following JSON schema definition:\n" +
	"```json\n" +
	`${JSON.stringify(respFormat, null, 2)}\n` +
	"```n"
    },
    {
      role: "user" as const,
      content: task,
    },
  ];
};
