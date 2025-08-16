import { AddNumbersInputSchema, type AddNumbersInput } from "./AddNumbersOllamaToolCall";

export const extractAddNumbersInput = (argv: string[]): AddNumbersInput => {
	const out: Record<string, unknown> = {};
	for (let i = 0; i < argv.length; i++) {
		const t = argv[i];
		if (t === "--a") out.a = argv[++i];
		else if (t === "--b") out.b = argv[++i];
		else if (out.a === undefined) out.a = t;
		else if (out.b === undefined) out.b = t;
	}
	return AddNumbersInputSchema.parse({ a: out.a, b: out.b });
};
