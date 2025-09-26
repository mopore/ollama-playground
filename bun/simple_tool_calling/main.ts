import { Ollama, type Message, type Tool } from "ollama"

/*
 * Tool "add_numbers" declaration for the LLM
 */
const toolsDefinition: Tool[] = [
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


/*
 * "add_numbers" implementation in Typescript adapting the declaration from above
 */
type AddNumbersInput = {
  a: number;
  b: number;
};

function add_numbers( input: AddNumbersInput) {
  const result = input.a + input.b;
  console.log(`Adding ${input.a} and ${input.b} to get ${result}`);
  return result;
}


let messagesForLLM: Message[] = [
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


async function main() {
  const ollama = new Ollama();

  console.log("Making initial call...");
  const firstResponse = await ollama.chat({
    model: "gpt-oss:20b",
    messages: messagesForLLM,
    tools: toolsDefinition,
  });

  const calls = firstResponse.message.tool_calls ?? [];
  if (calls.length === 0) {
    console.error("Model did not request any wish for tool calls.");
    return;
  }

  // We know the LLM wants a tool call!

  // We store the first respone of the chat to manually keep the context
  messagesForLLM = [...messagesForLLM, firstResponse.message];

  for (const call of calls) {
    const toolName = call.function.name;
    if (toolName !== "add_numbers") {
      throw new Error(`Unexpected tool requested: ${toolName}`);
    }
    console.log("Model wants a tool call to solve task");

    // Ollama may return stringified arguments; normalize
    const rawArgs = (call.function as any).arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    const result = add_numbers(args);
    console.log(`Executed ${toolName}(${args.a}, ${args.b}) = ${result}`);

    messagesForLLM = [
      ...messagesForLLM,
      {
        role: "tool",
        tool_name: "add_numbers",
        content: JSON.stringify({ result }),
      },
    ];
  }

  console.log("Sending tool call result back to model");
  const finalResponse = await ollama.chat({
    model: "gpt-oss:20b",
    messages: messagesForLLM,
  });

  console.log(`Final model output:"${finalResponse.message.content}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
