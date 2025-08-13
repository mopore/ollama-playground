import { z } from 'zod';

export const AddInput = z.object({
    a: z.number().describe("First number to add"),
    b: z.number().describe("Second number to add"),
});

export const AddOutput = z.object({
    sum: z.number().describe("a + b"),
});

export type TAddInput = z.infer<typeof AddInput>;
export type TaddOutput = z.infer<typeof AddOutput>;
