import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Message, Tool } from "ollama";


export const AddNumbersInputSchema = z.object({
	a: z.coerce.number().describe("The first number to add"),
	b: z.coerce.number().describe("The second number to add"),
});

export type AddNumbersInput = z.infer<typeof AddNumbersInputSchema>;

export const AddNumbersOutputSchema = z.object({
	input: AddNumbersInputSchema,
	output: z.coerce.number().describe("The sum of a and b"),
});

export type AddNumbersOutput = z.infer<typeof AddNumbersOutputSchema>;


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
	const respFormat = zodToJsonSchema(AddNumbersOutputSchema, {
		name: "ResponseFormat",
	});

	return [
		{
			role: "system" as const,
			content:
				"You are a helpful assistant.\n" +
				"Prefer calling tools for any requested actions and knowledge requests.\n" +
				"Provide your response in JSON.\n" +
				"Use the following JSON schema definition:\n" +
				"```json\n" +
				`${JSON.stringify(respFormat, null, 2)}\n` +
				"```n"
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
