import { extractTaskInput } from "./parseArgs";
import { OllamaHandler } from "./OllamaHandler";
import type { IOllamaConfig } from "./IOllamaConfig";
import { AddNumbersOllamaTool } from "./AddNumbersOllamaTool";
import { MakeNoteOllamaTool } from "./MakeNoteOllamaTool";
import type { IOllamaTool } from "./IOllamaTool";
import type { ZodTypeAny } from "zod";


// To run with a "custom" config, you can set the environment variables:
//
// HOST=http://localhost:11434 OLLAMA_MODEL=gpt-oss:20b bun run main.ts -t "Add 3 and 5"
//
//
const c: IOllamaConfig = {
	host: process.env.HOST || "http://localhost:11434",
	model: process.env.OLLAMA_MODEL || "gpt-oss:20b", //
};

const ADD_NUMBERS_TOOL = "add_numbers";
const MAKE_NOTE_TOOL = "make_note";


const main = async () => {
	const taskDescription = extractTaskInput(process.argv);
	console.log(`Main: Task description: ${taskDescription.task}`);

	const addNumbersOllamaTool = new AddNumbersOllamaTool();
	const makeNoteOllamaTool = new MakeNoteOllamaTool();

	console.log(`Main: Setting up Ollama (at ${c.host} with ${c.model}...`);
	const handler = new OllamaHandler(c);

	const m = new Map<string, IOllamaTool<ZodTypeAny, ZodTypeAny>>();
	m.set(ADD_NUMBERS_TOOL, addNumbersOllamaTool);
	m.set(MAKE_NOTE_TOOL, makeNoteOllamaTool);

	handler.registerTools(m);
	const usedToolName = await handler.callOllama(taskDescription.task);

	if (usedToolName === ADD_NUMBERS_TOOL) {
		const o = addNumbersOllamaTool.retrieveStoredOutput();
		if (!o) {
			throw new Error("No output stored in the tool.");
		}

		const userOutput = `Main: The sum of ${o.input.a} and ${o.input.b} is ${o.output}.`;
		console.log(userOutput);
	}
	else if (usedToolName === MAKE_NOTE_TOOL) {
		const o = makeNoteOllamaTool.retrieveStoredOutput();
		if (!o) {
			throw new Error("No output stored in the tool.");
		}
		console.log("Main: Execution resutl:", o.confirmation);
	}
	else {
		throw new Error(`Unexpected or no tool used: ${usedToolName}`);
	}
};

main().catch((err) => {
	console.error("Client error:", err);
	process.exit(1);
});

