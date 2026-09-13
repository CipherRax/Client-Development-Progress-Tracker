import { PrismaClient, ProjectStatus, ProjectHealth, MilestoneStatus, TaskStatus, TaskPriority, UpdateVisibility, ActivityEventType, ActorType, ChangeRequestStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { generateSecureToken, hashToken } from '../src/common/utils/secure-token.util';
import { addDaysUtc } from '../src/common/utils/date.util';

/**
 * Trackly development seed — creates fictional example data only.
 *
 * All records below (clients, projects, milestones, tasks, updates) are
 * fabricated demo content used to sanity-check the app locally and to onboard
 * contributors. They do NOT resemble any real client information.
 *
 * Safety: this script refuses to run when NODE_ENV is "production" so it can
 * never be executed against a real deployment. It also never deletes existing
 * rows, but note that it inserts new clients/projects on every run.
 */
if (process.env.NODE_ENV === 'production') {
  console.error(
    'Refusing to seed: NODE_ENV=production. The seed script only ever creates fictional example data for local development.',
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database (fictional example data)...');

  // ── Admin ──────────────────────────────────────────────────────────
  const passwordHash = await argon2.hash('DemoPass123!', { type: argon2.argon2id });
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@trackly.dev' },
    update: {},
    create: {
      name: 'Demo Developer',
      email: 'admin@trackly.dev',
      passwordHash,
    },
  });
  console.log(`Admin ready: ${admin.email} / DemoPass123!`);

  // ── Clients ────────────────────────────────────────────────────────
  const clientA = await prisma.client.create({
    data: {
      name: 'Amina Hassan',
      companyName: 'Hassan Retail Ltd',
      email: 'amina@hassanretail.example',
      phone: '+254712345678',
      notes: 'Prefers weekly update emails.',
    },
  });

  const clientB = await prisma.client.create({
    data: {
      name: 'David Mwangi',
      companyName: 'Mwangi Logistics',
      email: 'david@mwangilogistics.example',
      phone: '+254798765432',
    },
  });

  const clientC = await prisma.client.create({
    data: {
      name: 'Fatuma Ali',
      companyName: null,
      email: 'fatuma.ali@example.com',
    },
  });

  // ── Project 1: in progress, with a full milestone/task/change-request history ──
  const startDate1 = new Date('2026-08-01T00:00:00.000Z');
  const originalCompletion1 = addDaysUtc(startDate1, 60);

  const project1 = await prisma.project.create({
    data: {
      clientId: clientA.id,
      name: 'E-Commerce Mobile Application',
      description: 'Cross-platform mobile commerce app with M-Pesa integration.',
      projectCode: 'ECOM-DEMO',
      status: ProjectStatus.IN_PROGRESS,
      health: ProjectHealth.ON_TRACK,
      startDate: startDate1,
      originalEstimatedCompletionDate: originalCompletion1,
      currentEstimatedCompletionDate: originalCompletion1,
      originalEstimatedDuration: 60,
      currentEstimatedDuration: 60,
    },
  });

  const milestoneDefs1: Array<{
    title: string;
    weight: number;
    status: MilestoneStatus;
    progress: number;
    order: number;
  }> = [
    { title: 'Requirements & Planning', weight: 10, status: MilestoneStatus.COMPLETED, progress: 100, order: 0 },
    { title: 'UI/UX Design', weight: 15, status: MilestoneStatus.COMPLETED, progress: 100, order: 1 },
    { title: 'Backend API', weight: 25, status: MilestoneStatus.IN_PROGRESS, progress: 60, order: 2 },
    { title: 'Mobile App', weight: 25, status: MilestoneStatus.PENDING, progress: 0, order: 3 },
    { title: 'Testing', weight: 15, status: MilestoneStatus.PENDING, progress: 0, order: 4 },
    { title: 'Deployment', weight: 10, status: MilestoneStatus.PENDING, progress: 0, order: 5 },
  ];

  for (const def of milestoneDefs1) {
    const milestone = await prisma.milestone.create({
      data: {
        projectId: project1.id,
        title: def.title,
        order: def.order,
        weight: def.weight,
        status: def.status,
        progressPercentage: def.progress,
        clientVisible: true,
        completedAt: def.status === MilestoneStatus.COMPLETED ? new Date() : null,
      },
    });

    if (def.title === 'Backend API') {
      await prisma.task.createMany({
        data: [
          {
            milestoneId: milestone.id,
            title: 'Design database schema',
            status: TaskStatus.COMPLETED,
            priority: TaskPriority.HIGH,
            order: 0,
            clientVisible: false,
            completedAt: new Date(),
          },
          {
            milestoneId: milestone.id,
            title: 'Implement authentication',
            status: TaskStatus.COMPLETED,
            priority: TaskPriority.CRITICAL,
            order: 1,
            clientVisible: false,
            completedAt: new Date(),
          },
          {
            milestoneId: milestone.id,
            title: 'Integrate M-Pesa payment processing',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            order: 2,
            clientVisible: true,
          },
          {
            milestoneId: milestone.id,
            title: 'Build order management endpoints',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            order: 3,
            clientVisible: false,
          },
        ],
      });
    }
  }

  const weightedProgress =
    milestoneDefs1.reduce((sum, m) => sum + (m.weight * m.progress) / 100, 0);
  await prisma.project.update({
    where: { id: project1.id },
    data: { progressPercentage: weightedProgress },
  });

  await prisma.currentWork.create({
    data: {
      projectId: project1.id,
      title: 'Payment Integration',
      description: 'Integrating M-Pesa payment processing into checkout flow.',
      expectedCompletionDate: addDaysUtc(new Date(), 5),
      active: true,
    },
  });

  await prisma.projectUpdate.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Design phase complete',
        content: 'The UI/UX design phase is complete and has moved into backend development.',
        visibility: UpdateVisibility.PUBLIC,
        createdById: admin.id,
      },
      {
        projectId: project1.id,
        title: 'Internal: vendor delay',
        content: 'M-Pesa sandbox credentials took 3 extra days to arrive from Safaricom.',
        visibility: UpdateVisibility.INTERNAL,
        createdById: admin.id,
      },
    ],
  });

  const changeRequest1 = await prisma.changeRequest.create({
    data: {
      projectId: project1.id,
      title: 'Add Google Sign-In',
      description: 'Client requested an additional login option beyond email/password.',
      reason: 'Client feedback after seeing a competitor app.',
      requestedBy: 'Amina Hassan',
      estimatedAdditionalDays: 3,
      estimatedAdditionalHours: 16,
      status: ChangeRequestStatus.APPROVED,
      previousCompletionDate: originalCompletion1,
      newCompletionDate: addDaysUtc(originalCompletion1, 3),
      approvedAt: new Date(),
      clientVisible: true,
    },
  });

  await prisma.project.update({
    where: { id: project1.id },
    data: {
      additionalTimeDays: 3,
      currentEstimatedCompletionDate: addDaysUtc(originalCompletion1, 3),
      currentEstimatedDuration: 63,
    },
  });

  await prisma.projectActivity.createMany({
    data: [
      {
        projectId: project1.id,
        actorType: ActorType.ADMIN,
        actorId: admin.id,
        eventType: ActivityEventType.PROJECT_CREATED,
        description: `Project "${project1.name}" was created.`,
      },
      {
        projectId: project1.id,
        actorType: ActorType.ADMIN,
        actorId: admin.id,
        eventType: ActivityEventType.CHANGE_REQUEST_APPROVED,
        description: `Change request "${changeRequest1.title}" approved. Completion date moved by 3 days.`,
        metadata: { changeRequestId: changeRequest1.id },
      },
      {
        projectId: project1.id,
        actorType: ActorType.ADMIN,
        actorId: admin.id,
        eventType: ActivityEventType.PUBLIC_UPDATE_CREATED,
        description: 'Public update published: "Design phase complete".',
      },
    ],
  });

  // Live client-access token for project 1 (printed at the end).
  const rawToken1 = generateSecureToken(32);
  await prisma.clientAccess.create({
    data: {
      projectId: project1.id,
      tokenHash: hashToken(rawToken1),
      active: true,
    },
  });

  // ── Project 2: paused, minimal history ────────────────────────────
  const startDate2 = new Date('2026-06-15T00:00:00.000Z');
  const originalCompletion2 = addDaysUtc(startDate2, 45);
  const project2 = await prisma.project.create({
    data: {
      clientId: clientB.id,
      name: 'Fleet Tracking Dashboard',
      description: 'Web dashboard for real-time fleet GPS tracking.',
      projectCode: 'FLEET-DEMO',
      status: ProjectStatus.PAUSED,
      health: ProjectHealth.AT_RISK,
      startDate: startDate2,
      originalEstimatedCompletionDate: originalCompletion2,
      currentEstimatedCompletionDate: originalCompletion2,
      originalEstimatedDuration: 45,
      currentEstimatedDuration: 45,
      pausedAt: new Date('2026-08-10T00:00:00.000Z'),
      pauseReason: 'Awaiting client decision on mapping provider.',
    },
  });

  await prisma.milestone.createMany({
    data: [
      {
        projectId: project2.id,
        title: 'Requirements',
        order: 0,
        weight: 20,
        status: MilestoneStatus.COMPLETED,
        progressPercentage: 100,
        clientVisible: true,
        completedAt: new Date(),
      },
      {
        projectId: project2.id,
        title: 'Map Integration',
        order: 1,
        weight: 40,
        status: MilestoneStatus.BLOCKED,
        progressPercentage: 20,
        clientVisible: true,
      },
      {
        projectId: project2.id,
        title: 'Reporting',
        order: 2,
        weight: 40,
        status: MilestoneStatus.PENDING,
        progressPercentage: 0,
        clientVisible: true,
      },
    ],
  });

  await prisma.project.update({ where: { id: project2.id }, data: { progressPercentage: 28 } });

  await prisma.projectActivity.create({
    data: {
      projectId: project2.id,
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      eventType: ActivityEventType.PROJECT_PAUSED,
      description: 'Project paused. Reason: Awaiting client decision on mapping provider.',
    },
  });

  const rawToken2 = generateSecureToken(32);
  await prisma.clientAccess.create({
    data: {
      projectId: project2.id,
      tokenHash: hashToken(rawToken2),
      active: true,
    },
  });

  // ── Project 3: completed, archived-eligible ───────────────────────
  const startDate3 = new Date('2026-03-01T00:00:00.000Z');
  const originalCompletion3 = addDaysUtc(startDate3, 30);
  const project3 = await prisma.project.create({
    data: {
      clientId: clientC.id,
      name: 'Restaurant Booking Website',
      description: 'Simple booking site with table reservations.',
      projectCode: 'BOOKING-DEMO',
      status: ProjectStatus.COMPLETED,
      health: ProjectHealth.ON_TRACK,
      startDate: startDate3,
      originalEstimatedCompletionDate: originalCompletion3,
      currentEstimatedCompletionDate: originalCompletion3,
      originalEstimatedDuration: 30,
      currentEstimatedDuration: 30,
      progressPercentage: 100,
      completedAt: addDaysUtc(startDate3, 29),
    },
  });

  await prisma.milestone.createMany({
    data: [
      {
        projectId: project3.id,
        title: 'Design & Build',
        order: 0,
        weight: 70,
        status: MilestoneStatus.COMPLETED,
        progressPercentage: 100,
        clientVisible: true,
        completedAt: addDaysUtc(startDate3, 20),
      },
      {
        projectId: project3.id,
        title: 'Launch',
        order: 1,
        weight: 30,
        status: MilestoneStatus.COMPLETED,
        progressPercentage: 100,
        clientVisible: true,
        completedAt: addDaysUtc(startDate3, 29),
      },
    ],
  });

  await prisma.projectActivity.create({
    data: {
      projectId: project3.id,
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      eventType: ActivityEventType.PROJECT_COMPLETED,
      description: 'Project marked complete.',
    },
  });

  console.log('\nSeed complete.\n');
  console.log('Admin login:');
  console.log('  email:    admin@trackly.dev');
  console.log('  password: DemoPass123!\n');
  console.log('Live client-access links (raw tokens, shown once — the seed script is the one exception for demo purposes):');
  console.log(`  ${project1.name}: header x-client-access-token: ${rawToken1}`);
  console.log(`  ${project2.name}: header x-client-access-token: ${rawToken2}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
