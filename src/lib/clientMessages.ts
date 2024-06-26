import { z } from 'zod';

import { todoSchema, userSchema } from '@/lib/types';

// client messages sent FROM a client TO the server

// client has updated local state
export const clientMessageUpdateUserDataSchema = z.object({
  type: z.literal('updateUserData'),
  data: userSchema.partial(),
  successMessage: z.string().optional(),
});
export type ClientMessageUpdateUserData = z.infer<typeof clientMessageUpdateUserDataSchema>;

// client changed visibility status
export const clientMessageVisibilityStatusSchema = z.object({
  type: z.literal('visibilityStatus'),
  visible: z.boolean(),
});
export type ClientMessageVisibilityStatus = z.infer<typeof clientMessageVisibilityStatusSchema>;

export const clientMessageCreateTodoSchema = z.object({
  type: z.literal('createTodo'),
  todo: todoSchema,
});
export type ClientMessageCreateTodo = z.infer<typeof clientMessageCreateTodoSchema>;

export const clientMessageUpdateTodosSchema = z.object({
  type: z.literal('updateTodos'),
  todoIds: z.array(z.string()),
  data: todoSchema.partial(),
});
export type ClientMessageUpdateTodos = z.infer<typeof clientMessageUpdateTodosSchema>;

export const clientMessageSchema = z.union([
  clientMessageUpdateUserDataSchema,
  clientMessageCreateTodoSchema,
  clientMessageVisibilityStatusSchema,
  clientMessageUpdateTodosSchema,
]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;
