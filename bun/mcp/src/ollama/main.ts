import { extractTaskInput } from "../parseArgs";
import { OllamaHandler } from "../ollama/OllamaHandler";
import type { IOllamaConfig } from "../ollama/IOllamaConfig";
import { allTools, ToolNames } from "../AllTools";


// To run with a "custom" config, you can set the environment variables:
//
// HOST=http://localhost:11434 OLLAMA_MODEL=gpt-oss:20b bun run main.ts -t "Add 3 and 5"
//
//
const c: IOllamaConfig = {
	host: process.env.HOST || "http://localhost:11434",
	// model: process.env.OLLAMA_MODEL || "orieg/gemma3-tools:27b",
	model: process.env.OLLAMA_MODEL || "gpt-oss:20b",
};

const printToolCallResult = (usedToolName: string | undefined) => {
	if (!usedToolName) {
		throw new Error("No tool was used by the model.");
	}
	if (usedToolName === ToolNames.ADD_NUMBERS) {
		const addNumbersOllamaTool = allTools.getTool(ToolNames.ADD_NUMBERS);
		const o = addNumbersOllamaTool.retrieveStoredOutput();
		if (!o) {
			throw new Error("No output stored in the tool.");
		}

		const userOutput = `Main: The sum of ${o.input.a} and ${o.input.b} is ${o.output}.`;
		console.log(userOutput);
	}
	else if (usedToolName === ToolNames.MAKE_NOTE) {
		const makeNoteOllamaTool = allTools.getTool(ToolNames.MAKE_NOTE);
		const o = makeNoteOllamaTool.retrieveStoredOutput();
		if (!o) {
			throw new Error("No output stored in the tool.");
		}
		console.log("Main: Execution results:", o.confirmation);
	}
	else {
		throw new Error(`Unexpected or no tool used: ${usedToolName}`);
	}
}

const main = async () => {
	const taskDescription = extractTaskInput(process.argv);
	console.log(`Main: Task description: ${taskDescription.task}`);

	console.log(`Main: Setting up Ollama (at ${c.host} with ${c.model}...`);
	const handler = new OllamaHandler(c);

	handler.registerTools(allTools.getToolMap());
	const usedToolName = await handler.callOllama(taskDescription.task);
	printToolCallResult(usedToolName);

};

main().catch((err) => {
	console.error("Client error:", err);
	console.trace();
	process.exit(1);
});

