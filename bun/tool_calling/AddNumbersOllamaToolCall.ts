import { z } from "zod";
import type { ToolInput, ToolOutput } from "./types";
import type { IOllamaToolCall } from "./IOllamaToolCall"; 
import type { IOllamaConfig } from "./IOllamaConfig";
import { OllamaHandler } from "./OllamaHandler";


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


export class AddNumbersOllamaToolCall implements IOllamaToolCall<typeof AddNumbersInputSchema, typeof AddNumbersOutputSchema> {

	private h: OllamaHandler | undefined;
	private i: AddNumbersInput | undefined;

	setOllamaConfig(c: IOllamaConfig): void {
		this.h = new OllamaHandler(c.host, c.model);
	}

	public readonly toolInputSchema = AddNumbersInputSchema;
	public readonly toolOutputSchema = AddNumbersOutputSchema;
	public readonly toolName = "add_numbers";

	get task(): string{
		if (!this.i) {
			throw new Error("Tool input not set. Please call setInput() first.");
		}
		const task = `Please compute the sum of ${this.i.a} and ${this.i.b}.`
		return task;
	}

	async execute(i: AddNumbersInput): Promise<AddNumbersOutput> {
		if (this.h === undefined) {
			throw new Error("OllamaHandler not set. Please call setOllamaConfig() first.");
		}
		this.i = i;
		const result = await this.h.callOllama(this);
		const output = this.toolOutputSchema.parse(result);
		return output;
	}

	executeImpl(i: AddNumbersInput): Promise<AddNumbersOutput> {
		const result = i.a + i.b;
		console.log(`Tool (executerImpl) called: add_numbers(${i.a}, ${i.b}) = ${result}`);
		const output: AddNumbersOutput = {
			input: i,
			output: result,
		};
		return Promise.resolve(output);
	}
}

