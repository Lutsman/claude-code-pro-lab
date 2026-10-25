import { z } from 'zod';

const title = z.string().trim().min(1, 'Title is required').max(200);

export const createTodoSchema = z.strictObject({ title });

export const updateTodoSchema = z
  .strictObject({ title, completed: z.boolean() })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Nothing to update');
