import z from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(10, { message: "Title must be at least 10 characters long" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
