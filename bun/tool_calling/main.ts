import { Ollama } from "ollama";
import { AddNumbersInputSchema } from "./types";
import { extractAddNumbersInput } from "./parseArgs";
import { ADD_NUMBERS_TOOL, addNumbersImpl, createInitialMessage } from "./tool_add_numbers";


const HOST = "http://10.200.0.2:11434";
// const HOST = "http://localhost:11434";

const MODEL = process.env.OLLAMA_MODEL || "gpt-oss:20b"; // model must support tools


const main = async () => {
	const ollama = new Ollama({ host: HOST });
	const addNumbersInput = extractAddNumbersInput(process.argv.slice(2));
	const messages = createInitialMessage(addNumbersInput);
	console.log(`Requesting initial response...`);
	let response = await ollama.chat({
		model: MODEL,
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
				const raw = (call.function as any).arguments;
				const parsed = typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
				const args = AddNumbersInputSchema.parse(parsed); // validate + coerce with zod
				const toolResult = addNumbersImpl(args);

				console.log(`Requesting response after tool response...`);
				const respAfterToolCall = await ollama.chat({
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

	const finalText = response.message?.content ?? "";
	console.log(`Result: ${finalText}`);
};

main().catch((err) => {
	console.error("Client error:", err);
	process.exit(1);
});

