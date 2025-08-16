import { z } from "zod";

export type ToolInput< T extends z.ZodTypeAny > = z.infer<T>;
export type ToolOutput< T extends z.ZodTypeAny > = z.infer<T>;

