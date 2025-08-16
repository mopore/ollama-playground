import type { Tool } from "ollama";
import type { ZodTypeAny } from "zod";
import type { ToolInput } from "./types";
import type { IOllamaConfig } from "./IOllamaConfig";

export interface IOllamaToolCall<I extends ZodTypeAny, O extends ZodTypeAny> {
	setOllamaConfig(c: IOllamaConfig): void;
	toolName: string;
	ollamaTool: Tool;
	task: string;
	toolInputSchema: I;
	toolOutputSchema: O;
	execute(input: ToolInput<I>): Promise<ToolInput<O>>;
	executeImpl(input: ToolInput<I>): Promise<ToolInput<O>>;
}
