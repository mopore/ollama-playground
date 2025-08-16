import { Ollama } from "ollama";
import { AddNumbersInputSchema, AddNumbersOutputSchema, type AddNumbersInput, type AddNumbersOutput  } from "./types";
import { ADD_NUMBERS_TOOL, addNumbersImpl, createInitialMessage } from "./tool_add_numbers";

export class OllamaHandler {
  constructor(
    private url: string,
    private readonly model: string,
  ) {}

  async callOllama(input: AddNumbersInput): Promise<AddNumbersOutput> {

    const ollama = new Ollama({ host: this.url });
    const messages = createInitialMessage(input);
    console.log(`Requesting initial response...`);
    let response = await ollama.chat({
      model: this.model,
      messages,
      tools: [ADD_NUMBERS_TOOL],
    });

    const toolCallRequested = response.message.tool_calls !== undefined && 
      response.message.tool_calls.length > 0
    if (toolCallRequested) {
      console.log("Model requested tool calls:");
      const toolCalls = response.message.tool_calls ?? [];
      for (const call of toolCalls) {
	if (call.function.name === "add_numbers") {
	  const inRaw = (call.function as any).arguments;
	  const inParsed = typeof inRaw === "string" ? JSON.parse(inRaw) : inRaw ?? {};
	  const toolInput: AddNumbersInput = AddNumbersInputSchema.parse(inParsed); // validate + coerce with zod

	  const toolOutput = addNumbersImpl(toolInput);

	  console.log(`Requesting response after tool called...`);
	  const respAfterToolCall = await ollama.chat({
	    model: this.model,
	    // format: "json",
	    stream: false,
	    messages: [
	      ...messages,
	      response.message,
	      {
		role: "tool",
		tool_name: "add_numbers",
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
	  throw new Error(`Unexpected tool call: ${call.function.name}`);
	}
      }
    }
    else {
      throw new Error("Model did not request tool calls.");
    }

    const ollamaResponse = response.message.content;
    const output = AddNumbersOutputSchema.parse(JSON.parse(ollamaResponse));
    return output;
  }

}
