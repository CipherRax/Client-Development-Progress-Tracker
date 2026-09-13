import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from '@/lib/validation/auth';
import {
  projectSchema,
  progressOverrideSchema,
  changeRequestSchema,
  contactSchema,
  updateSchema,
} from '@/lib/validation';

describe('auth validation', () => {
  it('accepts a valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'pw' }).success).toBe(true);
  });

  it('rejects a bad email', () => {
    const r = loginSchema.safeParse({ email: 'nope', password: 'pw' });
    expect(r.success).toBe(false);
  });

  it('enforces password strength and confirmation on register', () => {
    const strong = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'StrongPass1!',
      confirmPassword: 'StrongPass1!',
    });
    expect(strong.success).toBe(true);

    const weak = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(weak.success).toBe(false);

    const mismatch = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'StrongPass1!',
      confirmPassword: 'WrongPass1!',
    });
    expect(mismatch.success).toBe(false);
  });

  it('requires current + new password on change', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
        confirmPassword: 'NewPass1!',
      }).success,
    ).toBe(true);
  });
});

describe('project validation', () => {
  it('requires a duration or a completion date via estimate mode', () => {
    expect(
      projectSchema.safeParse({
        clientId: 'uuid',
        name: 'Full rebuild',
        startDate: '2026-09-01',
        estimateMode: 'duration',
        estimatedDurationDays: 30,
        status: 'PLANNING',
        health: 'ON_TRACK',
      }).success,
    ).toBe(true);
  });

  it('rejects ETA before start date', () => {
    expect(
      projectSchema.safeParse({
        clientId: 'uuid',
        name: 'Full rebuild',
        startDate: '2026-09-01',
        estimateMode: 'date',
        estimatedCompletionDate: '2026-08-01',
        status: 'PLANNING',
        health: 'ON_TRACK',
      }).success,
    ).toBe(false);
  });

  it('binds progress override to 0..100', () => {
    expect(progressOverrideSchema.safeParse({ progressPercentage: 101 }).success).toBe(false);
    expect(progressOverrideSchema.safeParse({ progressPercentage: 55 }).success).toBe(true);
  });
});

describe('form validation', () => {
  it('requires at least 1 additional day for a change request', () => {
    expect(changeRequestSchema.safeParse({ title: 'Change request', estimatedAdditionalDays: 0 }).success).toBe(false);
    expect(changeRequestSchema.safeParse({ title: 'Change request', estimatedAdditionalDays: 2 }).success).toBe(true);
  });

  it('requires 10+ characters for a project update', () => {
    expect(updateSchema.safeParse({ title: 'Hi', content: 'short', visibility: 'PUBLIC' }).success).toBe(false);
    expect(
      updateSchema.safeParse({ title: 'Phase one', content: 'A longer update for the client.', visibility: 'INTERNAL' }).success,
    ).toBe(true);
  });

  it('validates contact form messages', () => {
    expect(contactSchema.safeParse({ name: 'A', email: 'a@b.co', message: 'hello' }).success).toBe(false);
    expect(
      contactSchema.safeParse({ name: 'Anna', email: 'a@b.co', message: 'A proper message to the team.' }).success,
    ).toBe(true);
  });
});