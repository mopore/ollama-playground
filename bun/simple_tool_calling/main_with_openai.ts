import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import type { FunctionToolCall } from "openai/resources/beta/threads/runs.mjs";

const client = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1"
});


/*
 * Tool "add_numbers" declaration for the LLM
 */
const toolsDefinition: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_numbers",
      description: "Adds two numbers together and returns the sum.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
        },
        required: ["a", "b"],
      },
    },
  },
];


type AddNumbersInput = { a: number; b: number; };

const add_numbers = (input: AddNumbersInput) => {
  const result = input.a + input.b;
  console.log(`Adding ${input.a} and ${input.b} to get ${result}`);
  return result;
}


let messagesForLLM: ChatCompletionMessageParam[] = [
  // Initial messages...
  {
    role: "system",
    content:
    "You are a helpful assistant. Prefer calling tools when appropriate.",
  },
  {
    role: "user",
    content: "Please add 42 and 58 using the function.",
  },
];



const main = async () => {

  console.log("Making initial call...");
  const firstResponse = await client.chat.completions.create({
    model: "gpt-oss:20b",
    messages: messagesForLLM,
    tools: toolsDefinition,
  });

  const firstMessage = firstResponse.choices[0]?.message
  if (firstMessage === undefined) {
    console.error("No response from the mode!");
    return;
  }

  const calls = firstMessage.tool_calls ?? [];
  if (calls.length === 0){
    console.error("Model did not request any tool calls");
    return;
  }

  // We store the first respone of the chat to manually keep the context
  messagesForLLM = [...messagesForLLM, firstMessage];

  for (const call of calls) {
    if (call.type !== "function"){
      console.error("No function call!");
      return;
    }
    const fc = call as FunctionToolCall;

    if (fc.function.name !== "add_numbers") {
      throw new Error(`Unexpected tool requested: ${fc.function.name}`);
    }
    console.log("Model wants a tool call to solve task");

    const args = JSON.parse(fc.function.arguments) as AddNumbersInput;

    const result = add_numbers(args);
    console.log(`Executed ${fc.function.name}(${args.a}, ${args.b}) = ${result}`);

    messagesForLLM.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify({ result }),
    });
  }

  console.log("Sending tool call result back to model");
  const finalResponse = await client.chat.completions.create({
    model: "gpt-oss:20b",
    messages: messagesForLLM,
  });

  const content = finalResponse.choices[0]?.message?.content?.trim();
  console.log(`Final model output:"${content}"`);
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});
