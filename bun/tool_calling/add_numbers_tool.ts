import { Ollama, type Tool } from "ollama";
import { z } from "zod";

/** CLI input: a and b */
const InputSchema = z.object({
	a: z.coerce.number(),
	b: z.coerce.number(),
});
type Input = z.infer<typeof InputSchema>;

/** Minimal CLI parsing: supports `client-ollama-tools.ts 3 5` or `--a 3 --b 5` */
const parseArgs = (argv: string[]): Input => {
	const out: Record<string, unknown> = {};
	for (let i = 0; i < argv.length; i++) {
		const t = argv[i];
		if (t === "--a") out.a = argv[++i];
		else if (t === "--b") out.b = argv[++i];
		else if (out.a === undefined) out.a = t;
		else if (out.b === undefined) out.b = t;
	}
	return InputSchema.parse({ a: out.a, b: out.b });
};

/** Local implementation of the tool the model may call */
const addNumbers = ({ a, b }: Input) => {
	const result = a + b;
	console.log(`Tool called: add_numbers(${a}, ${b}) = ${result}`);
	return { result };
};

/** The tool schema we expose to the model */
const tools: Tool[] = [
	{
		type: "function",
		function: {
			name: "add_numbers",
			description: "Add two numbers and return the sum.",
			parameters: {
				type: "object",
				properties: {
					a: { type: "number", description: "The first number" },
					b: { type: "number", description: "The second number" },
				},
				required: ["a", "b"],
			},
		},
	},
];

// const HOST = "http://10.200.0.2:11434";
const HOST = "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "gpt-oss:20b"; // model must support tools

const main = async () => {
	const { a, b } = parseArgs(process.argv.slice(2));

	console.log(`Connecting to Ollama (host=${HOST}) ...`);
	console.log("Connected.");

	// Initial user request that nudges the model to use the tool
	const messages = [
		{
			role: "system" as const,
			content:
				"You are a helpful assistant. Prefer calling tools for arithmetic instead of doing math in your head.",
		},
		{
			role: "user" as const,
			content: `Please compute the sum of ${a} and ${b}.`,
		},
	];

	const ollama = new Ollama({ host: "10.200.0.2" });
	console.log(`Requesting with tools...`);
	let response = await ollama.chat({
		model: MODEL,
		messages,
		tools,
	});

	// If the model decides to call our tool, handle it
	if (response.message.tool_calls && response.message.tool_calls.length > 0) {
		for (const call of response.message.tool_calls) {
			if (call.function.name === "add_numbers") {
				// <-- FIX: accept object or JSON string
				const raw = (call.function as any).arguments;
				const parsed = typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
				const args = InputSchema.parse(parsed); // validate + coerce with zod

				const toolResult = addNumbers(args);

				const followUp = await ollama.chat({
					model: MODEL,
					messages: [
						...messages,
						response.message, // the assistant message that contained tool_calls
						{
							role: "tool",
							tool_name: "add_numbers",
							content: JSON.stringify(toolResult),
						},
					],
				});
				response = followUp;
			}
		}
	}

	const finalText = response.message?.content ?? "";
	console.log(`Result: ${finalText}`);
};

main().catch((err) => {
	console.error("Client error:", err);
	process.exit(1);
});

