import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { hashToken } from '../../common/utils/secure-token.util';

@Injectable()
export class ClientAccessGuard implements CanActivate {
  private readonly logger = new Logger(ClientAccessGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('A client access token is required.');
    }

    const tokenHash = hashToken(token);

    // Deliberately generic error message below: we never reveal whether a
    // token was never valid, expired, or revoked — that distinction could
    // help an attacker enumerate/brute-force tokens.
    const access = await this.prisma.clientAccess.findUnique({
      where: { tokenHash },
      include: { project: true },
    });

    if (!access || !access.active) {
      this.logger.warn('Rejected client access attempt: invalid or inactive token.');
      throw new UnauthorizedException('Invalid or expired access link.');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      this.logger.warn(`Rejected client access attempt: expired token for project ${access.projectId}.`);
      throw new UnauthorizedException('Invalid or expired access link.');
    }

    if (!access.project || access.project.archivedAt || !access.project.clientAccessEnabled) {
      this.logger.warn(`Rejected client access attempt: project ${access.projectId} is not accessible.`);
      throw new UnauthorizedException('Invalid or expired access link.');
    }

    // Fire-and-forget access bookkeeping; failures here must never block
    // (or leak information via timing to) the actual response.
    this.prisma.clientAccess
      .update({
        where: { id: access.id },
        data: { lastAccessedAt: new Date(), accessCount: { increment: 1 } },
      })
      .catch((err: any) => this.logger.error('Failed to record client access telemetry', err));

    // Attach the resolved, already-authorized project to the request.
    // Every downstream handler in the public module reads ONLY from this —
    // never from a client-supplied project id — which is what makes cross
    // -project access structurally impossible rather than just checked.
    request.clientProject = access.project;
    request.clientAccessId = access.id;

    return true;
  }

  private extractToken(request: any): string | null {
    const headerToken = request.headers['x-client-access-token'];
    if (typeof headerToken === 'string' && headerToken.length > 0) {
      return headerToken;
    }

    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }

    // Fallback for simple GET-link usage. Documented as less secure since
    // query strings can end up in server/proxy logs and browser history.
    if (typeof request.query?.token === 'string' && request.query.token.length > 0) {
      return request.query.token;
    }

    return null;
  }
}
