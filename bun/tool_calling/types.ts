import { z } from "zod";

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

