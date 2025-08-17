import { extractTaskInput } from "../parseArgs";
import { allTools, ToolNames } from "../AllTools";
import { OllamaViaMcpHandler } from "../ollama/OllamaViaMcpHandler";
import type { IOllamaViaMcpConfig } from "../ollama/IOllamaViaMcpConfig";


const main = async () => {

	const c: IOllamaViaMcpConfig = {
		ollamaHost: process.env.HOST || "http://localhost:11434",
		ollamaModel: process.env.OLLAMA_MODEL || "gpt-oss:20b", //
		mcpHost: process.env.MCP_HOST ||  "http://localhost:8080/mcp",
	}

	const taskDescription = extractTaskInput(process.argv);
	console.log(`Main: Task description: ${taskDescription.task}`);

	console.log(`Main: Setting up Ollama (at ${c.ollamaHost} with ${c.ollamaModel}...`);
	const handler = new OllamaViaMcpHandler(c);

	handler.registerTools(allTools.getToolMap());
	const usedToolName = await handler.callOllama(taskDescription.task);

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
