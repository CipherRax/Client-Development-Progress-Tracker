import { z } from 'zod';

export const changeRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().default(''),
  reason: z.string().optional().default(''),
  estimatedAdditionalDays: z.coerce.number().int().min(1, 'Must be at least 1 day'),
  estimatedAdditionalHours: z.coerce.number().min(0).optional(),
  clientVisible: z.boolean().default(true),
});

export type ChangeRequestValues = z.infer<typeof changeRequestSchema>;

export const updateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Write at least 10 characters'),
  visibility: z.enum(['PUBLIC', 'INTERNAL']).default('PUBLIC'),
});

export type UpdateValues = z.infer<typeof updateSchema>;

export const currentWorkSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().default(''),
  expectedCompletionDate: z.string().optional().default(''),
});

export type CurrentWorkValues = z.infer<typeof currentWorkSchema>;

export const clientAccessSchema = z.object({
  expiresAt: z.string().optional().default(''),
});

export type ClientAccessValues = z.infer<typeof clientAccessSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, 'Your name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export type ContactValues = z.infer<typeof contactSchema>;