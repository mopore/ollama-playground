import { z } from "zod";

export const TaskInputSchema = z.object({
  task: z.string().min(1, "Task cannot be empty"),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

export const extractTaskInput = (argv: string[]): TaskInput => {
  let task: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "-t" || t === "--task") {
      task = argv[++i];
      break;
    }
  }

  if (!task) {
    throw new Error(
      `Invalid usage.\n\nUsage:\n  programname -t "This is the text of the task"\n  programname --task "This is another text"`
    );
  }

  return TaskInputSchema.parse({ task });
};
