import { ProjectActivity } from '@prisma/client';

export interface PublicActivityDto {
  eventType: string;
  description: string;
  createdAt: Date;
}

// Client-safe subset of the activity log: description + timestamp only.
// Internal metadata (actor IDs, raw diffs) is never exposed publicly.
const CLIENT_VISIBLE_EVENT_TYPES = new Set([
  'PROJECT_CREATED',
  'STATUS_CHANGED',
  'HEALTH_CHANGED',
  'MILESTONE_COMPLETED',
  'CHANGE_REQUEST_APPROVED',
  'PROJECT_PAUSED',
  'PROJECT_RESUMED',
  'PROJECT_COMPLETED',
  'PUBLIC_UPDATE_CREATED',
]);

export function isClientVisibleActivity(eventType: string): boolean {
  return CLIENT_VISIBLE_EVENT_TYPES.has(eventType);
}

export function mapPublicActivity(activity: ProjectActivity): PublicActivityDto {
  return {
    eventType: activity.eventType,
    description: activity.description,
    createdAt: activity.createdAt,
  };
}
