import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import type { FunctionToolCall } from "openai/resources/beta/threads/runs.mjs";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

type ToolInput< T extends z.ZodTypeAny > = z.infer<T>;
type ToolOutput< T extends z.ZodTypeAny > = z.infer<T>;

const AddNumbersInputSchema = z.object({
  a: z.coerce.number().describe("The first number to add"),
  b: z.coerce.number().describe("The second number to add"),
});

const AddNumbersOutputSchema = z.object({
  input: AddNumbersInputSchema,
  output: z.coerce.number().describe("The sum of a and b"),
});

type AddNumbersInput = ToolInput<typeof AddNumbersInputSchema>;
type AddNumbersOutput = ToolOutput<typeof AddNumbersOutputSchema>;

const paramSchema = zodToJsonSchema(AddNumbersInputSchema);
const parsedParamSchema = JSON.parse(JSON.stringify(paramSchema, null, 2));

/*
 * Tool "add_numbers" declaration for the LLM
 */
const toolsDefinition: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_numbers",
      description: "Adds two numbers together and returns the sum.",
      parameters: parsedParamSchema
    },
  },
];

const add_numbers = (i: AddNumbersInput): Promise<AddNumbersOutput> => {
  const result = i.a + i.b;
  console.log(`AddNumbersOllamaTool.executeTool: add_numbers(${i.a}, ${i.b}) = ${result}`);
  const output: AddNumbersOutput = {
    input: i,
    output: result,
  };
  return Promise.resolve(output);
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
    content: "Please add forty two and fifty seven using the tool.",
  },
];


const main = async () => {
  const client = new OpenAI({
    apiKey: "ollama",
    baseURL: "http://localhost:11434/v1"
  });


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

    const result = await add_numbers(args);
    console.log(`\nExecuted ${fc.function.name}(${args.a}, ${args.b})`);
    console.log(`Result: ${JSON.stringify(result)}\n`);

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
