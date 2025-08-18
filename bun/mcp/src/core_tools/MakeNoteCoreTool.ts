import { z } from "zod";
import type { ToolInput, ToolOutput } from "./types";
import type { ICoreTool } from "./ICoreTool"; 
import os from "os";
import path from "path";
import fs from "fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";


export const MakeNoteInputSchema = z.object({
	content: z.coerce.string().min(3).describe("The content of the note to be made and stored."),
});

export const MakeNoteOutputSchema = z.object({
	input: MakeNoteInputSchema,
	confirmation: z.coerce.boolean().describe("Confirmation of the successful note creation."),
});

export type MakeNoteInput = ToolInput<typeof MakeNoteInputSchema>;

export type MakeNoteOutput = ToolOutput<typeof MakeNoteOutputSchema>;


export class MakeNoteCoreTool implements ICoreTool<typeof MakeNoteInputSchema, typeof MakeNoteOutputSchema> {

	private readonly _toolName = "make_note";
	private readonly _toolDescription = "A tool to make or take a note and store it on the desktop.";
	private o: MakeNoteOutput | undefined;

	public readonly toolInputSchema = MakeNoteInputSchema;
	public readonly toolOutputSchema = MakeNoteOutputSchema;

	public get toolName(): string {
		return this._toolName;
	}

	get toolDescription(): string{
		return this._toolDescription;
	}

	executeTool(i: MakeNoteInput): Promise<MakeNoteOutput> {
		console.log(`MakeNoteCoreTool.executeTool: make a note with "${i.content}"`);

		const desktopPath = path.join(os.homedir(), "Desktop", "make_note_tool.txt");
		fs.writeFileSync(desktopPath, i.content, "utf8");

		console.log(`MakeNoteCoreTool.executeTool: Note saved to ${desktopPath}`);

		const output: MakeNoteOutput = {
			input: i,
			confirmation: true,
		};
		return Promise.resolve(output);
	}

	registerAtMcpServer(server: McpServer): void {
		server.registerTool(
			this.toolName,
			{
				title: this.toolName,
				description: this.toolDescription,
				inputSchema: MakeNoteInputSchema.shape,
			},
			async (i: MakeNoteInput) => {
				console.log("Entering MCP context");
				const o: MakeNoteOutput = await this.executeTool(i);
				const oJson = JSON.stringify(o, null, 2);
				console.log("Leaving MCP context");
				return { 
					content: [{ type: "text", text: oJson }],
					"structuredContent": JSON.parse(oJson)
				}
			}
		);
	}

	storeOutput(o: MakeNoteOutput): void {
		this.o = o;
	}
	
	retrieveStoredOutput(): MakeNoteOutput | undefined {
		return this.o;
	}
}

