import { z } from "zod";

export const AddNumbersInputSchema = z.object({
	a: z.coerce.number(),
	b: z.coerce.number(),
});
export type AddNumbersInput = z.infer<typeof AddNumbersInputSchema>;

export const AddNumbersOutputSchema = z.object({
	input: AddNumbersInputSchema,
	output: z.coerce.number(),
});

export type AddNumbersOutput = z.infer<typeof AddNumbersOutputSchema>;

