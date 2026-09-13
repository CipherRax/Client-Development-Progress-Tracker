import { z } from 'zod';
import { MILESTONE_STATUSES } from './enums';

export const milestoneSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional().default(''),
    weight: z.coerce.number().min(0).max(100).default(1),
    startDate: z.string().optional().default(''),
    estimatedCompletionDate: z.string().optional().default(''),
    clientVisible: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (
      v.startDate &&
      v.estimatedCompletionDate &&
      v.estimatedCompletionDate < v.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['estimatedCompletionDate'],
        message: 'Estimated completion cannot be before the start date',
      });
    }
  });

export type MilestoneValues = z.infer<typeof milestoneSchema>;

export const milestoneStatusSchema = z.object({
  status: z.enum(MILESTONE_STATUSES),
});

export type MilestoneStatusValues = z.infer<typeof milestoneStatusSchema>;