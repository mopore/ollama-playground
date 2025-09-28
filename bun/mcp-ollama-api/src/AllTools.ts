import type { ZodTypeAny } from "zod";
import type { ICoreTool } from "./core_tools/ICoreTool";
import { AddNumbersCoreTool } from "./core_tools/AddNumbersCoreTool";
import { MakeNoteCoreTool } from "./core_tools/MakeNoteCoreTool";

export const ToolNames = {
	ADD_NUMBERS : "add_numbers",
	MAKE_NOTE : "make_note"
}

class AllTools {

	private readonly toolMap: Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>>;

	constructor() {
		this.toolMap = new Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>>();
		this.toolMap.set(ToolNames.ADD_NUMBERS, new AddNumbersCoreTool());
		this.toolMap.set(ToolNames.MAKE_NOTE, new MakeNoteCoreTool());
	}

	getAllNames(): string[] {
		return Array.from(this.toolMap.keys());
	}

	getTool(name: string): ICoreTool<ZodTypeAny, ZodTypeAny> {
		const tool = this.toolMap.get(name);
		if (tool === undefined) {
			const errMessage = `Tool "${name}" not found. Available tools: ${Array.from(this.toolMap.keys()).join(", ")}`;
			console.error(errMessage);
			console.trace();
			throw new Error(errMessage);
		}
		return tool;
	}

	getToolMap(): Map<string, ICoreTool<ZodTypeAny, ZodTypeAny>> {
		return this.toolMap;
	}
}

export const allTools = new AllTools();
