import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional().default(''),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export type ClientValues = z.infer<typeof clientSchema>;