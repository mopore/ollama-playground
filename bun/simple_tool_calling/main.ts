import { Ollama, type Message, type Tool } from "ollama"

// the function/tool implementation
function add_numbers({ a, b }: { a: number; b: number }) {
  const result = a + b;
  console.log(`Adding ${a} and ${b} to get ${result}`);
  return a + b
}

// --- tool definition for the model ---
const toolsDefinition: Tool[] = [
  {
    type: "function",
    function: {
      name: "add_numbers",
      description: "Add two numbers together.",
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

const messages: Message[] = [
  // Messages to start with...
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
  const first = await ollama.chat({
    model: "gpt-oss:20b",
    messages,
    tools: toolsDefinition,
  });

  const calls = first.message.tool_calls ?? [];
  if (calls.length === 0) {
    console.error("Model did not request any tool calls.");
    return;
  }

  let followupMessages: Message[] = [...messages, first.message];

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

    followupMessages = [
      ...followupMessages,
      {
        role: "tool",
        tool_name: "add_numbers",
        content: JSON.stringify({ result }),
      },
    ];
  }

  console.log("Sending tool call result back to model");
  const final = await ollama.chat({
    model: "gpt-oss:20b",
    messages: followupMessages,
  });

  console.log("\nFinal model output:\n", final.message.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
