import {
  CHANGE_REQUEST_STATUS_META,
  CLIENT_STATUS_META,
  HEALTH_META,
  MILESTONE_STATUS_META,
  PRIORITY_META,
  PROJECT_STATUS_META,
  TASK_STATUS_META,
  UPDATE_VISIBILITY_META,
} from '@/lib/presentation';
import type {
  ChangeRequestStatus,
  ClientStatus,
  MilestoneStatus,
  ProjectHealth,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  UpdateVisibility,
} from '@/lib/api/types';
import { Pill } from './pill';

export function StatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  return <Pill meta={PROJECT_STATUS_META[status]} className={className} />;
}

export function HealthPill({ health, className }: { health: ProjectHealth; className?: string }) {
  return <Pill meta={HEALTH_META[health]} className={className} />;
}

export function MilestoneStatusPill({ status, className }: { status: MilestoneStatus; className?: string }) {
  return <Pill meta={MILESTONE_STATUS_META[status]} className={className} />;
}

export function TaskStatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  return <Pill meta={TASK_STATUS_META[status]} className={className} />;
}

export function PriorityPill({ priority, className }: { priority: TaskPriority; className?: string }) {
  return <Pill meta={PRIORITY_META[priority]} className={className} />;
}

export function ClientStatusPill({ status, className }: { status: ClientStatus; className?: string }) {
  return <Pill meta={CLIENT_STATUS_META[status]} className={className} />;
}

export function ChangeRequestStatusPill({ status, className }: { status: ChangeRequestStatus; className?: string }) {
  return <Pill meta={CHANGE_REQUEST_STATUS_META[status]} className={className} />;
}

export function UpdateVisibilityPill({ visibility, className }: { visibility: UpdateVisibility; className?: string }) {
  return <Pill meta={UPDATE_VISIBILITY_META[visibility]} className={className} />;
}