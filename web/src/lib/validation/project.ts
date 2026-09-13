import { z } from 'zod';
import { PROJECT_STATUSES, PROJECT_HEALTHS } from './enums';

const isoDayRe = /^\d{4}-\d{2}-\d{2}$/;

export const projectSchema = z
  .object({
    clientId: z.string().min(1, 'Select a client'),
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().optional().default(''),
    startDate: z.string().min(1, 'Start date is required').regex(isoDayRe, 'Use YYYY-MM-DD'),
    estimateMode: z.enum(['duration', 'date']),
    estimatedDurationDays: z.coerce.number().int().positive().optional(),
    estimatedCompletionDate: z.string().regex(isoDayRe, 'Use YYYY-MM-DD').optional(),
    status: z.enum(PROJECT_STATUSES).default('PLANNING'),
    health: z.enum(PROJECT_HEALTHS).default('ON_TRACK'),
  })
  .superRefine((v, ctx) => {
    if (v.startDate && v.estimatedCompletionDate && v.estimatedCompletionDate < v.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['estimatedCompletionDate'],
        message: 'Estimated completion cannot be before the start date',
      });
    }
  });

export type ProjectValues = z.infer<typeof projectSchema>;

export const progressOverrideSchema = z.object({
  progressPercentage: z.coerce
    .number()
    .min(0, 'Between 0 and 100')
    .max(100, 'Between 0 and 100'),
  reason: z.string().max(200).optional().default(''),
});

export type ProgressOverrideValues = z.infer<typeof progressOverrideSchema>;

export const projectNameSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
});

export type ProjectNameValues = z.infer<typeof projectNameSchema>;

export const projectDescriptionSchema = z.object({
  description: z.string().max(3000).optional().default(''),
});

export type ProjectDescriptionValues = z.infer<typeof projectDescriptionSchema>;

export const projectStartDateSchema = z.object({
  startDate: z.string().min(1, 'Start date is required').regex(isoDayRe, 'Use YYYY-MM-DD'),
});

export type ProjectStartDateValues = z.infer<typeof projectStartDateSchema>;

export const projectStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES),
});

export type ProjectStatusValues = z.infer<typeof projectStatusSchema>;

export const projectHealthSchema = z.object({
  health: z.enum(PROJECT_HEALTHS),
});

export type ProjectHealthValues = z.infer<typeof projectHealthSchema>;

export const pauseProjectSchema = z.object({
  reason: z.string().max(500).optional().default(''),
});

export type PauseProjectValues = z.infer<typeof pauseProjectSchema>;

export const completeProjectSchema = z.object({
  notes: z.string().max(1000).optional().default(''),
});

export type CompleteProjectValues = z.infer<typeof completeProjectSchema>;