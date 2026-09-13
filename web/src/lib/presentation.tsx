import type { JSX } from 'react';
import {
  Archive,
  Activity,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  Cog,
  FlaskConical,
  Hammer,
  Hourglass,
  PauseCircle,
  Rocket,
  Skull,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
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

export interface PillStyle {
  className: string;
  dotClassName: string;
  label: string;
  Icon: JSX.Element;
}

function icon(node: JSX.Element) {
  return node;
}

export const PROJECT_STATUS_META: Record<ProjectStatus, PillStyle> = {
  PLANNING: {
    className: 'bg-zinc-400/10 text-zinc-600 dark:text-zinc-300 border-zinc-400/30',
    dotClassName: 'bg-zinc-400',
    label: 'Planning',
    Icon: icon(<Sparkles />),
  },
  REQUIREMENTS: {
    className: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    dotClassName: 'bg-violet-500',
    label: 'Requirements',
    Icon: icon(<Users />),
  },
  IN_PROGRESS: {
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dotClassName: 'bg-sky-500',
    label: 'In Progress',
    Icon: icon(<Hammer />),
  },
  AWAITING_CLIENT: {
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotClassName: 'bg-amber-500',
    label: 'Awaiting Client',
    Icon: icon(<Clock />),
  },
  CLIENT_REVIEW: {
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotClassName: 'bg-amber-500',
    label: 'Client Review',
    Icon: icon(<Activity />),
  },
  CHANGES_REQUESTED: {
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
    dotClassName: 'bg-orange-500',
    label: 'Changes Requested',
    Icon: icon(<Wrench />),
  },
  PAUSED: {
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
    dotClassName: 'bg-yellow-500',
    label: 'Paused',
    Icon: icon(<PauseCircle />),
  },
  DELAYED: {
    className: 'bg-danger/15 text-red-700 dark:text-red-300 border-danger/30',
    dotClassName: 'bg-danger',
    label: 'Delayed',
    Icon: icon(<TriangleAlert />),
  },
  READY_FOR_TESTING: {
    className: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    dotClassName: 'bg-fuchsia-500',
    label: 'Ready for Testing',
    Icon: icon(<FlaskConical />),
  },
  TESTING: {
    className: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    dotClassName: 'bg-fuchsia-500',
    label: 'Testing',
    Icon: icon(<FlaskConical />),
  },
  DEPLOYMENT: {
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    dotClassName: 'bg-purple-500',
    label: 'Deployment',
    Icon: icon(<Rocket />),
  },
  COMPLETED: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'Completed',
    Icon: icon(<CheckCircle2 />),
  },
  CANCELLED: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Cancelled',
    Icon: icon(<Skull />),
  },
  ARCHIVED: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Archived',
    Icon: icon(<Archive />),
  },
};

export const HEALTH_META: Record<ProjectHealth, PillStyle> = {
  ON_TRACK: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'On Track',
    Icon: icon(<CheckCircle2 />),
  },
  AT_RISK: {
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotClassName: 'bg-amber-500',
    label: 'At Risk',
    Icon: icon(<TriangleAlert />),
  },
  DELAYED: {
    className: 'bg-danger/15 text-red-700 dark:text-red-300 border-danger/30',
    dotClassName: 'bg-danger',
    label: 'Delayed',
    Icon: icon(<TriangleAlert />),
  },
};

export const MILESTONE_STATUS_META: Record<MilestoneStatus, PillStyle> = {
  PENDING: {
    className: 'bg-zinc-400/10 text-zinc-600 dark:text-zinc-300 border-zinc-400/30',
    dotClassName: 'bg-zinc-400',
    label: 'Pending',
    Icon: icon(<CircleDashed />),
  },
  IN_PROGRESS: {
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dotClassName: 'bg-sky-500',
    label: 'In Progress',
    Icon: icon(<CircleDot />),
  },
  COMPLETED: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'Completed',
    Icon: icon(<CheckCircle2 />),
  },
  BLOCKED: {
    className: 'bg-danger/15 text-red-700 dark:text-red-300 border-danger/30',
    dotClassName: 'bg-danger',
    label: 'Blocked',
    Icon: icon(<TriangleAlert />),
  },
  SKIPPED: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Skipped',
    Icon: icon(<CircleDashIcon />),
  },
};

function CircleDashIcon() {
  return <CircleDashed />;
}

export const TASK_STATUS_META: Record<TaskStatus, PillStyle> = {
  TODO: {
    className: 'bg-zinc-400/10 text-zinc-600 dark:text-zinc-300 border-zinc-400/30',
    dotClassName: 'bg-zinc-400',
    label: 'To Do',
    Icon: icon(<CircleDashed />),
  },
  IN_PROGRESS: {
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dotClassName: 'bg-sky-500',
    label: 'In Progress',
    Icon: icon(<CircleDot />),
  },
  BLOCKED: {
    className: 'bg-danger/15 text-red-700 dark:text-red-300 border-danger/30',
    dotClassName: 'bg-danger',
    label: 'Blocked',
    Icon: icon(<TriangleAlert />),
  },
  COMPLETED: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'Completed',
    Icon: icon(<CheckCircle2 />),
  },
  CANCELLED: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Cancelled',
    Icon: icon(<Skull />),
  },
};

export const PRIORITY_META: Record<TaskPriority, PillStyle> = {
  LOW: {
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dotClassName: 'bg-sky-500',
    label: 'Low',
    Icon: icon(<CircleDot />),
  },
  MEDIUM: {
    className: 'bg-zinc-400/10 text-zinc-600 dark:text-zinc-300 border-zinc-400/30',
    dotClassName: 'bg-zinc-400',
    label: 'Medium',
    Icon: icon(<CircleDot />),
  },
  HIGH: {
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotClassName: 'bg-amber-500',
    label: 'High',
    Icon: icon(<TriangleAlert />),
  },
  CRITICAL: {
    className: 'bg-danger/15 text-red-700 dark:text-red-300 border-danger/30',
    dotClassName: 'bg-danger',
    label: 'Critical',
    Icon: icon(<Zap />),
  },
};

export const CHANGE_REQUEST_STATUS_META: Record<ChangeRequestStatus, PillStyle> = {
  PENDING: {
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotClassName: 'bg-amber-500',
    label: 'Pending',
    Icon: icon(<Hourglass />),
  },
  APPROVED: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'Approved',
    Icon: icon(<CheckCircle2 />),
  },
  REJECTED: {
    className: 'bg-danger/15 text-red-700 dark:text-red-300 border-danger/30',
    dotClassName: 'bg-danger',
    label: 'Rejected',
    Icon: icon(<Skull />),
  },
  CANCELLED: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Cancelled',
    Icon: icon(<XIcon />),
  },
};

function XIcon() {
  return <CircleDashed />;
}

export const CLIENT_STATUS_META: Record<ClientStatus, PillStyle> = {
  ACTIVE: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'Active',
    Icon: icon(<CheckCircle2 />),
  },
  ARCHIVED: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Archived',
    Icon: icon(<Archive />),
  },
};

export const UPDATE_VISIBILITY_META: Record<UpdateVisibility, PillStyle> = {
  PUBLIC: {
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClassName: 'bg-emerald-500',
    label: 'Public',
    Icon: icon(<Target />),
  },
  INTERNAL: {
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    dotClassName: 'bg-zinc-500',
    label: 'Internal',
    Icon: icon(<Cog />),
  },
};

export function projectStatusFlow(): ProjectStatus[] {
  return [
    'PLANNING',
    'REQUIREMENTS',
    'IN_PROGRESS',
    'AWAITING_CLIENT',
    'CLIENT_REVIEW',
    'CHANGES_REQUESTED',
    'READY_FOR_TESTING',
    'TESTING',
    'DEPLOYMENT',
  ];
}

export function isTerminal(status: ProjectStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'ARCHIVED';
}