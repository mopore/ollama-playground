import { z } from "zod";
import type { ToolInput, ToolOutput } from "./types";
import type { IOllamaTool } from "./IOllamaTool"; 


export const AddNumbersInputSchema = z.object({
	a: z.coerce.number().describe("The first number to add"),
	b: z.coerce.number().describe("The second number to add"),
});

export const AddNumbersOutputSchema = z.object({
	input: AddNumbersInputSchema,
	output: z.coerce.number().describe("The sum of a and b"),
});

export type AddNumbersInput = ToolInput<typeof AddNumbersInputSchema>;

export type AddNumbersOutput = ToolOutput<typeof AddNumbersOutputSchema>;


export class AddNumbersOllamaTool implements IOllamaTool<typeof AddNumbersInputSchema, typeof AddNumbersOutputSchema> {

	private readonly _toolName = "add_numbers";
	private readonly _toolDescription = "A tool to add two numbers together.";
	private o: AddNumbersOutput | undefined;

	public readonly toolInputSchema = AddNumbersInputSchema;
	public readonly toolOutputSchema = AddNumbersOutputSchema;

	public get toolName(): string {
		return this._toolName;
	}

	get toolDescription(): string{
		return this._toolDescription;
	}

	executeTool(i: AddNumbersInput): Promise<AddNumbersOutput> {
		const result = i.a + i.b;
		console.log(`AddNumbersOllamaTool.executeTool: add_numbers(${i.a}, ${i.b}) = ${result}`);
		const output: AddNumbersOutput = {
			input: i,
			output: result,
		};
		return Promise.resolve(output);
	}

	storeOutput(o: AddNumbersOutput): void {
		this.o = o;
	}
	
	retrieveStoredOutput(): AddNumbersOutput | undefined {
		return this.o;
	}
}

