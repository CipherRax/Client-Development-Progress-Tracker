import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * End-to-end smoke of both products against a running, seeded stack:
 *   - API on :3000  (seed with `npm run seed` in the API repo first)
 *   - Web on  :3002  (this app, `npm run dev` or `npm run build && npm run start`)
 *
 * Flows covered: admin login → create client → create project → generate a
 * client-access link → open the public dashboard → revoke it → link dies.
 */

const ADMIN_EMAIL = process.env.PW_ADMIN_EMAIL ?? 'admin@trackly.dev';
const ADMIN_PASSWORD = process.env.PW_ADMIN_PASSWORD ?? 'DemoPass123!';
const API_BASE = process.env.PW_API_BASE ?? 'http://localhost:3000/api/v1';

const apiUrl = (path: string) => `${API_BASE}${path}`;

async function loginAsAdmin(api: APIRequestContext) {
  const res = await api.post(apiUrl('/auth/login'), { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.data as {
    admin: { id: string; name: string; email: string };
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  };
}

test.describe.serial('full system smoke', () => {
  let accessToken: string;
  let clientId: string;
  let projectId: string;
  let publicLink: string;

  test('admin can sign in and create a client + project', async ({ request }) => {
    const session = await loginAsAdmin(request);
    accessToken = session.tokens.accessToken;
    expect(session.admin.email).toBe(ADMIN_EMAIL);

    const headers = { Authorization: `Bearer ${accessToken}` };
    const name = `E2E ${Date.now()}`;

    const clientRes = await request.post(apiUrl('/clients'), {
      headers,
      data: { name, email: `${name.toLowerCase()}@example.test`.replace(/[^a-z0-9@.-]/g, 'x') },
    });
    expect(clientRes.ok()).toBeTruthy();
    const client = await clientRes.json();
    clientId = client.data.id;

    const projectRes = await request.post(apiUrl('/projects'), {
      headers,
      data: {
        clientId,
        name: `${name} Website`,
        description: 'Playwright-driven project',
        startDate: new Date().toISOString().slice(0, 10),
        estimatedDurationDays: 30,
      },
    });
    expect(projectRes.ok()).toBeTruthy();
    const project = await projectRes.json();
    projectId = project.data.id;
    expect(project.data.progressPercentage).toBe(0);

    // Add a milestone + task and move through the lifecycle far enough to be public-ready.
    const m = await request.post(apiUrl(`/projects/${projectId}/milestones`), {
      headers,
      data: { title: 'Kickoff', clientVisible: true },
    });
    expect(m.ok()).toBeTruthy();
    const milestone = (await m.json()).data;

    const task = await request.post(apiUrl(`/milestones/${milestone.id}/tasks`), {
      headers,
      data: { title: 'Scaffold', clientVisible: true },
    });
    expect(task.ok()).toBeTruthy();
  });

  test('admin console loads and lists the new project', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByText('E2E', { exact: false }).first()).toBeVisible();
  });

  test('generating client access yields a working public dashboard, revoke kills it', async ({
    request,
    page,
  }) => {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const gen = await request.post(apiUrl(`/projects/${projectId}/client-access`), { headers });
    expect(gen.ok()).toBeTruthy();
    const genBody = await gen.json();
    publicLink = genBody.data.url;
    expect(publicLink).toContain('/p/');

    // Open the public dashboard fresh (separate context = no admin session).
    const publicPage = await page.context().newPage();
    await publicPage.goto(publicLink);
    await expect(publicPage.getByText('Trackly', { exact: false }).first()).toBeVisible();
    await publicPage.close();

    const revoke = await request.post(apiUrl(`/projects/${projectId}/client-access/revoke`), { headers });
    expect(revoke.ok()).toBeTruthy();

    const claim = await page.context().newPage();
    await claim.goto(publicLink);
    await expect(claim.getByText('This link is invalid or has been revoked')).toBeVisible();
    await claim.close();
  });
});