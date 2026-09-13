import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from './enums';

export const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().default(''),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  estimatedHours: z.coerce.number().min(0).max(10000).optional(),
  clientVisible: z.boolean().default(true),
});

export type TaskValues = z.infer<typeof taskSchema>;

export const taskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export type TaskStatusValues = z.infer<typeof taskStatusSchema>;