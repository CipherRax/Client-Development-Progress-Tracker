import { ChangeRequest } from '@prisma/client';

export interface PublicChangeRequestDto {
  title: string;
  description: string | null;
  status: string;
  approvedAt: Date | null;
  previousCompletionDate: Date | null;
  newCompletionDate: Date | null;
}

// Only ever called with clientVisible === true records (set automatically
// on approval) — pending/internal change requests must never reach this.
export function mapPublicChangeRequest(cr: ChangeRequest): PublicChangeRequestDto {
  return {
    title: cr.title,
    description: cr.description,
    status: cr.status,
    approvedAt: cr.approvedAt,
    previousCompletionDate: cr.previousCompletionDate,
    newCompletionDate: cr.newCompletionDate,
  };
}
