import { extractAddNumbersInput } from "./parseArgs";
import { OllamaHandler } from "./ollama_handler";


// To run with a "custom" config, you can set the environment variables:
// HOST=http://localhost:11434 OLLAMA_MODEL=gpt-oss:20b bun run main.ts 100 200
//
//
const HOST = process.env.HOST || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "gpt-oss:20b"; // model must support tools


const main = async () => {
	const addNumbersInput = extractAddNumbersInput(process.argv.slice(2));

	const ollamaHandler = new OllamaHandler(HOST, MODEL);
	const o = await ollamaHandler.callOllama(addNumbersInput);

	const userOutput = `The sum of ${o.input.a} and ${o.input.b} is ${o.output}.`;
	console.log(userOutput);
};

main().catch((err) => {
	console.error("Client error:", err);
	process.exit(1);
});

