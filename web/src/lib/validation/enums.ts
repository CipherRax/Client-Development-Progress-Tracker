export const PROJECT_STATUSES = [
  'PLANNING',
  'REQUIREMENTS',
  'IN_PROGRESS',
  'AWAITING_CLIENT',
  'CLIENT_REVIEW',
  'CHANGES_REQUESTED',
  'PAUSED',
  'DELAYED',
  'READY_FOR_TESTING',
  'TESTING',
  'DEPLOYMENT',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
] as const;

export const PROJECT_HEALTHS = ['ON_TRACK', 'AT_RISK', 'DELAYED'] as const;

export const MILESTONE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED'] as const;

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'] as const;

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const CHANGE_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

export const UPDATE_VISIBILITIES = ['PUBLIC', 'INTERNAL'] as const;

/** Terminal statuses: locked from further state changes. */
export const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'ARCHIVED'] as const;