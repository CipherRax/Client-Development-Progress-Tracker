// ─── Envelopes ────────────────────────────────────────────────────
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

// ─── Enums ────────────────────────────────────────────────────────
export type ClientStatus = 'ACTIVE' | 'ARCHIVED';

export type ProjectStatus =
  | 'PLANNING'
  | 'REQUIREMENTS'
  | 'IN_PROGRESS'
  | 'AWAITING_CLIENT'
  | 'CLIENT_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'PAUSED'
  | 'DELAYED'
  | 'READY_FOR_TESTING'
  | 'TESTING'
  | 'DEPLOYMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'DELAYED';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type UpdateVisibility = 'PUBLIC' | 'INTERNAL';

// ─── Admin Auth ───────────────────────────────────────────────────
export interface Admin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  admin: Admin;
  tokens: TokenPair;
}

// ─── Client ───────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  notes?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

// ─── Project ──────────────────────────────────────────────────────
export interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string | null;
  projectCode: string;
  status: ProjectStatus;
  health: ProjectHealth;
  startDate: string;
  originalEstimatedCompletionDate: string;
  currentEstimatedCompletionDate: string;
  originalEstimatedDuration: number;
  currentEstimatedDuration: number;
  additionalTimeDays: number;
  pausedTimeDays: number;
  progressPercentage: number;
  progressManualOverride: boolean;
  pausedAt?: string | null;
  pauseReason?: string | null;
  resumedAt?: string | null;
  pausedFromStatus?: ProjectStatus | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  clientAccessEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  client?: { id: string; name: string; companyName?: string | null };
  milestones?: Milestone[];
  currentMilestone?: { id: string; title: string } | null;
  nextMilestone?: { id: string; title: string } | null;
  estimatedDaysRemaining?: number;
  changeRequestSummary?: { pending: number; approved: number; rejected: number; total: number };
  recentUpdates?: ProjectUpdate[];
  recentActivity?: ProjectActivity[];
  currentWork?: CurrentWork[];
}

// ─── Milestone ────────────────────────────────────────────────────
export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  order: number;
  weight: number;
  status: MilestoneStatus;
  progressPercentage: number;
  startDate?: string | null;
  estimatedCompletionDate?: string | null;
  completedAt?: string | null;
  clientVisible: boolean;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

// ─── Task ─────────────────────────────────────────────────────────
export interface Task {
  id: string;
  milestoneId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  estimatedHours?: number | null;
  actualHours?: number | null;
  clientVisible: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

// ─── Change Request ───────────────────────────────────────────────
export interface ChangeRequest {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  reason?: string | null;
  requestedAt: string;
  requestedBy?: string | null;
  status: ChangeRequestStatus;
  estimatedAdditionalDays: number;
  estimatedAdditionalHours?: number | null;
  previousCompletionDate?: string | null;
  newCompletionDate?: string | null;
  clientVisible: boolean;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Project Update ───────────────────────────────────────────────
export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdById?: string | null;
  visibility: UpdateVisibility;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Project Activity ─────────────────────────────────────────────
export interface ProjectActivity {
  id: string;
  projectId: string;
  actorType: 'ADMIN' | 'SYSTEM' | 'CLIENT';
  actorId?: string | null;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Current Work ─────────────────────────────────────────────────
export interface CurrentWork {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  expectedCompletionDate?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Client Access ────────────────────────────────────────────────
export interface ClientAccessRecord {
  id: string;
  active: boolean;
  createdAt: string;
  revokedAt?: string | null;
  lastAccessedAt?: string | null;
  expiresAt?: string | null;
  accessCount: number;
}

export interface ClientAccessTokenGenerated {
  url: string;
  token: string;
  createdAt: string;
  expiresAt?: string | null;
}

// ─── Public Dashboard (read-only DTO) ─────────────────────────────
export interface PublicProject {
  name: string;
  description?: string | null;
  status: ProjectStatus;
  health: ProjectHealth;
  progress: number;
  startDate: string;
  originalEstimatedCompletionDate: string;
  estimatedCompletionDate: string;
  estimatedDaysRemaining: number;
  additionalTimeDays: number;
  pausedTimeDays: number;
}

export interface PublicMilestone {
  title: string;
  description?: string | null;
  status: MilestoneStatus;
  progress: number;
  estimatedCompletionDate?: string | null;
  completedAt?: string | null;
  tasks?: PublicTask[];
}

export interface PublicTask {
  title: string;
  status: TaskStatus;
}

export interface PublicUpdate {
  title: string;
  content: string;
  publishedAt: string;
}

export interface PublicChangeRequest {
  title: string;
  description?: string | null;
  status: ChangeRequestStatus;
  approvedAt?: string | null;
  previousCompletionDate?: string | null;
  newCompletionDate?: string | null;
}

export interface PublicActivity {
  eventType: string;
  description: string;
  createdAt: string;
}

export interface PublicCurrentWork {
  title: string;
  description?: string | null;
  expectedCompletionDate?: string | null;
}

export interface PublicDashboardData {
  project: PublicProject;
  currentWork: PublicCurrentWork | null;
  nextMilestone: { title: string } | null;
  milestones: PublicMilestone[];
  updates: PublicUpdate[];
  changeRequests: PublicChangeRequest[];
  timeline: PublicActivity[];
}