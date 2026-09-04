import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Client Development Progress Tracker (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: any;

  let accessToken: string;
  let adminEmail: string;

  let clientAId: string;
  let clientBId: string;
  let projectAId: string;
  let projectBId: string;
  let milestoneAId: string;
  let taskAId: string;
  let changeRequestId: string;

  let clientTokenA: string;
  let clientTokenB: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    http = app.getHttpServer();
    prisma = app.get(PrismaService);

    await cleanDatabase(prisma);

    adminEmail = `e2e-admin-${Date.now()}@devtracker.dev`;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  // ── Authentication ──────────────────────────────────────────────
  describe('Authentication', () => {
    it('registers a new admin', async () => {
      const res = await request(http)
        .post('/api/v1/auth/register')
        .send({ name: 'E2E Admin', email: adminEmail, password: 'SuperSecret123!' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe(adminEmail);
      accessToken = res.body.data.tokens.accessToken;
    });

    it('rejects duplicate registration', async () => {
      await request(http)
        .post('/api/v1/auth/register')
        .send({ name: 'Dup', email: adminEmail, password: 'SuperSecret123!' })
        .expect(409);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: 'SuperSecret123!' })
        .expect(200);
      accessToken = res.body.data.tokens.accessToken;
    });

    it('rejects login with wrong password', async () => {
      await request(http)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: 'WrongPassword' })
        .expect(401);
    });

    it('returns the current admin from /auth/me', async () => {
      const res = await request(http)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.data.email).toBe(adminEmail);
    });

    it('rejects admin endpoints without a token', async () => {
      await request(http).get('/api/v1/auth/me').expect(401);
    });
  });

  // ── Clients & Projects ───────────────────────────────────────────
  describe('Clients and Projects', () => {
    it('creates two clients', async () => {
      const a = await request(http)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Client A', email: `a-${Date.now()}@example.com` })
        .expect(201);
      clientAId = a.body.data.id;

      const b = await request(http)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Client B', email: `b-${Date.now()}@example.com` })
        .expect(201);
      clientBId = b.body.data.id;

      expect(clientAId).not.toBe(clientBId);
    });

    it('creates a project for each client with consistent dates', async () => {
      const a = await request(http)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: clientAId,
          name: 'Project A - Secret Client Portal',
          startDate: '2026-08-01',
          estimatedDurationDays: 40,
        })
        .expect(201);
      projectAId = a.body.data.id;
      expect(a.body.data.originalEstimatedCompletionDate).toBeDefined();
      expect(a.body.data.currentEstimatedCompletionDate).toBe(
        a.body.data.originalEstimatedCompletionDate,
      );

      const b = await request(http)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: clientBId,
          name: 'Project B - Confidential Fleet App',
          startDate: '2026-06-01',
          estimatedCompletionDate: '2026-07-15',
        })
        .expect(201);
      projectBId = b.body.data.id;
    });

    it('rejects inconsistent duration vs completion date', async () => {
      await request(http)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: clientAId,
          name: 'Inconsistent Project',
          startDate: '2026-08-01',
          estimatedDurationDays: 10,
          estimatedCompletionDate: '2026-12-01',
        })
        .expect(400);
    });

    it('lists projects with pagination metadata', async () => {
      const res = await request(http)
        .get('/api/v1/projects?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.meta).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Milestones, Tasks, Progress ──────────────────────────────────
  describe('Milestones, Tasks and Progress Calculation', () => {
    it('creates weighted milestones under Project A', async () => {
      const m1 = await request(http)
        .post(`/api/v1/projects/${projectAId}/milestones`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Design', weight: 50, clientVisible: true })
        .expect(201);
      milestoneAId = m1.body.data.id;

      await request(http)
        .post(`/api/v1/projects/${projectAId}/milestones`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Build', weight: 50, clientVisible: true })
        .expect(201);
    });

    it('creates a task and completing it drives milestone + project progress', async () => {
      const t1 = await request(http)
        .post(`/api/v1/milestones/${milestoneAId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Wireframes' })
        .expect(201);
      taskAId = t1.body.data.id;

      await request(http)
        .post(`/api/v1/milestones/${milestoneAId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'High-fidelity mockups' })
        .expect(201);

      await request(http)
        .patch(`/api/v1/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      const milestone = await request(http)
        .get(`/api/v1/milestones/${milestoneAId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      // 1 of 2 tasks complete => 50% milestone progress
      expect(milestone.body.data.progressPercentage).toBe(50);

      const project = await request(http)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      // Design (weight 50, progress 50%) + Build (weight 50, progress 0%) = 25%
      expect(project.body.data.progressPercentage).toBe(25);
    });
  });

  // ── Change Requests: approval recalculates the ETA and preserves history ──
  describe('Change Requests', () => {
    it('creates and approves a change request, preserving the previous completion date', async () => {
      const before = await request(http)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const previousEta = before.body.data.currentEstimatedCompletionDate;

      const cr = await request(http)
        .post(`/api/v1/projects/${projectAId}/change-requests`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Add SSO', estimatedAdditionalDays: 5 })
        .expect(201);
      changeRequestId = cr.body.data.id;

      const approved = await request(http)
        .post(`/api/v1/change-requests/${changeRequestId}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(approved.body.data.status).toBe('APPROVED');
      expect(approved.body.data.previousCompletionDate).toBe(previousEta);
      expect(approved.body.data.newCompletionDate).not.toBe(previousEta);

      const after = await request(http)
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(after.body.data.additionalTimeDays).toBe(5);
      expect(after.body.data.currentEstimatedCompletionDate).not.toBe(previousEta);
    });

    it('cannot approve the same change request twice (concurrency guard)', async () => {
      await request(http)
        .post(`/api/v1/change-requests/${changeRequestId}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });
  });

  // ── Project lifecycle guards ──────────────────────────────────────
  describe('Project status transitions', () => {
    it('rejects setting status directly to COMPLETED via the generic endpoint', async () => {
      await request(http)
        .patch(`/api/v1/projects/${projectAId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'COMPLETED' })
        .expect(400);
    });

    it('allows a valid status transition', async () => {
      await request(http)
        .patch(`/api/v1/projects/${projectAId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'TESTING' })
        .expect(200);
    });
  });

  // ── Client Access & the critical isolation guarantee ──────────────
  describe('Client Access links and public API', () => {
    it('generates a client-access link for Project A', async () => {
      const res = await request(http)
        .post(`/api/v1/projects/${projectAId}/client-access`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(201);
      expect(res.body.data.url).toContain(res.body.data.token);
      clientTokenA = res.body.data.token;
    });

    it('generates a client-access link for Project B', async () => {
      const res = await request(http)
        .post(`/api/v1/projects/${projectBId}/client-access`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(201);
      clientTokenB = res.body.data.token;
    });

    it('rejects public access with no token', async () => {
      await request(http).get('/api/v1/public/project').expect(401);
    });

    it('rejects public access with a garbage token', async () => {
      await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', 'not-a-real-token')
        .expect(401);
    });

    it("returns ONLY Project A's data for token A", async () => {
      const res = await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenA)
        .expect(200);

      expect(res.body.data.project.name).toBe('Project A - Secret Client Portal');
      expect(res.body.data.project.name).not.toContain('Fleet');
    });

    it("returns ONLY Project B's data for token B — proving isolation", async () => {
      const res = await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenB)
        .expect(200);

      expect(res.body.data.project.name).toBe('Project B - Confidential Fleet App');
      expect(res.body.data.project.name).not.toContain('Secret Client Portal');
    });

    it('CRITICAL: token A can never surface Project B data under any parameter tampering', async () => {
      // There is no project-id parameter in the public API at all — the
      // project is derived exclusively from the validated token server-side.
      // We still probe common bypass attempts defensively.
      const attempts = [
        request(http)
          .get(`/api/v1/public/project?projectId=${projectBId}`)
          .set('x-client-access-token', clientTokenA),
        request(http)
          .get(`/api/v1/public/project/${projectBId}`)
          .set('x-client-access-token', clientTokenA),
      ];

      for (const attempt of attempts) {
        const res = await attempt;
        if (res.status === 200) {
          expect(res.body.data.project.name).not.toBe('Project B - Confidential Fleet App');
        } else {
          expect([401, 404]).toContain(res.status);
        }
      }
    });

    it('internal-only fields are never present in the public payload', async () => {
      const res = await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenA)
        .expect(200);

      const raw = JSON.stringify(res.body);
      expect(raw).not.toContain('passwordHash');
      expect(raw).not.toContain('tokenHash');
      expect(res.body.data.project.id).toBeUndefined();
      expect(res.body.data.project.clientId).toBeUndefined();
    });

    it('does not expose internal (non-public) updates to the client', async () => {
      await request(http)
        .post(`/api/v1/projects/${projectAId}/updates`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Internal note', content: 'Do not show this to the client.', visibility: 'INTERNAL' })
        .expect(201);

      await request(http)
        .post(`/api/v1/projects/${projectAId}/updates`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Public note', content: 'Design is progressing well.', visibility: 'PUBLIC' })
        .expect(201);

      const res = await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenA)
        .expect(200);

      const titles = res.body.data.updates.map((u: any) => u.title);
      expect(titles).toContain('Public note');
      expect(titles).not.toContain('Internal note');
    });

    it('does not expose non-client-visible tasks', async () => {
      const res = await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenA)
        .expect(200);

      const allTaskTitles = res.body.data.milestones.flatMap((m: any) =>
        m.tasks.map((t: any) => t.title),
      );
      // Neither seeded task was marked clientVisible.
      expect(allTaskTitles).not.toContain('Wireframes');
    });

    it('accepts a contact message without allowing any modification', async () => {
      const res = await request(http)
        .post('/api/v1/public/project/contact')
        .set('x-client-access-token', clientTokenA)
        .send({ name: 'Client Contact', email: 'client@example.com', message: 'How is it going?' })
        .expect(201);
      expect(res.body.data.message).toBeDefined();
    });

    it('revokes access and the old link immediately stops working', async () => {
      await request(http)
        .post(`/api/v1/projects/${projectAId}/client-access/revoke`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenA)
        .expect(401);
    });

    it('regenerating a link invalidates the previous one', async () => {
      const regenerated = await request(http)
        .post(`/api/v1/projects/${projectBId}/client-access/regenerate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(201);
      const newTokenB = regenerated.body.data.token;

      // Old token B no longer works.
      await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', clientTokenB)
        .expect(401);

      // New token B works and still only shows Project B.
      const res = await request(http)
        .get('/api/v1/public/project')
        .set('x-client-access-token', newTokenB)
        .expect(200);
      expect(res.body.data.project.name).toBe('Project B - Confidential Fleet App');
    });

    it('a client token cannot be used to call admin endpoints', async () => {
      await request(http)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${clientTokenB}`)
        .expect(401);
    });
  });
});

async function cleanDatabase(prisma: PrismaService) {
  await prisma.contactMessage.deleteMany();
  await prisma.clientAccess.deleteMany();
  await prisma.projectActivity.deleteMany();
  await prisma.currentWork.deleteMany();
  await prisma.projectUpdate.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.admin.deleteMany({ where: { email: { contains: 'e2e-admin-' } } });
}
