import type { Message, Tool } from "ollama";
import type { AddNumbersInput, AddNumbersOutput } from "./types";

export const ADD_NUMBERS_TOOL: Tool = {
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
}


export const createInitialMessage = (input: AddNumbersInput): Message[] => {
	return [
		{
			role: "system" as const,
			content:
				"You are a helpful assistant. Prefer calling tools for arithmetic instead of doing math in your head.",
		},
		{
			role: "user" as const,
			content: `Please compute the sum of ${input.a} and ${input.b}.`,
		},
	];
}


export const addNumbersImpl = (i: AddNumbersInput): AddNumbersOutput => {
	const result = i.a + i.b;
	console.log(`Tool called: add_numbers(${i.a}, ${i.b}) = ${result}`);
	return {
		input: i,
		output: result,
	};
};

