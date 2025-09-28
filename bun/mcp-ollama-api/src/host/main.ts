import { extractTaskInput } from "../parseArgs";
import { allTools, ToolNames } from "../AllTools";
import { OllamaMcpHost } from "../ollama/OllamaMcpHost";
import type { IOllamaMcpHostConfig } from "../ollama/IOllamaMcpHostConfig";

const printCallResult = (usedToolName: string | undefined): void => {
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
		console.log("Main: Execution result:", o.confirmation);
	}
	else {
		throw new Error(`Unexpected or no tool used: ${usedToolName}`);
	}
}

const main = async () => {

	const c: IOllamaMcpHostConfig = {
		ollamaHost: process.env.HOST || "http://localhost:11434",
		ollamaModel: process.env.OLLAMA_MODEL || "gpt-oss:20b", //
		mcpHost: process.env.MCP_HOST ||  "http://localhost:8080/mcp",
	}

	const taskDescription = extractTaskInput(process.argv);
	console.log(`Main: Task description: ${taskDescription.task}`);

	console.log(`Main: Setting up Ollama MCP Host (at ${c.ollamaHost} with ${c.ollamaModel}...`);
	const host = new OllamaMcpHost(c);
	host.registerTools(allTools.getToolMap());

	const usedToolName = await host.callOllama(taskDescription.task);
	printCallResult(usedToolName);

};

main().catch((err) => {
	console.error("Host error:", err);
	console.trace();
	process.exit(1);
});
