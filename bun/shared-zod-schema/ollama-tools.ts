import { Ollama, type Tool } from "ollama";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AddInput, AddOutput } from "./schemas.js";

const tools: Tool[] = [
    {
        type: "function",
        function: {
            name: "add_numbers",
            description: "Return the arithmetic sum of a and b.",
            parameters: zodToJsonSchema(AddInput, "AddInput"),
        },
    },
];

const HOST = "http://localhost:11434";
const MODEL = "gpt-oss:20b"; // model must support tools

console.log("Calling Ollama...");

const ollama = new Ollama({ host: HOST});
const response = await ollama.chat({
    model: MODEL,
    messages: [{ role: "user", content: "Add 40 and 2" }],
    format: zodToJsonSchema(AddOutput, "AddOutput"),
    tools,
});

console.log(`"Response: ${response}`);
