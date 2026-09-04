import { ProjectUpdate } from '@prisma/client';

export interface PublicUpdateDto {
  title: string;
  content: string;
  publishedAt: Date;
}

// Only ever called with visibility === PUBLIC records — internal updates
// must never reach this mapper (enforced by the query in public.service.ts).
export function mapPublicUpdate(update: ProjectUpdate): PublicUpdateDto {
  return {
    title: update.title,
    content: update.content,
    publishedAt: update.publishedAt,
  };
}
