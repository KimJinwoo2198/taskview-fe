import { expect, request as playwrightRequest, test, type BrowserContext, type Page } from "@playwright/test";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  BE_BASE_URL,
  FE_BASE_URL,
  MAILPIT_BASE_URL,
  appPathFromMailLink,
  appUrl,
  attachDiagnostics,
  bridgeInternalHttpSession,
  captureCheckpoint,
  expectServiceReady,
  safePrefix,
  waitForMailActionLink,
  type E2EManifest,
} from "./support";

const password = "NeedexE2E2026!";
const execFileAsync = promisify(execFile);

test.describe.configure({ mode: "serial" });

async function signUpFromInvitation({
  context,
  invitationLink,
  email,
  displayName,
  mailApi,
  screenshotRoot,
  screenshotNumber,
}: {
  context: BrowserContext;
  invitationLink: string;
  email: string;
  displayName: string;
  mailApi: Awaited<ReturnType<typeof playwrightRequest.newContext>>;
  screenshotRoot: string;
  screenshotNumber: number;
}) {
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  const invitationPath = appPathFromMailLink(invitationLink);
  await page.goto(appUrl(invitationPath));
  await expect(page.getByRole("heading", { name: "워크스페이스에 초대받았어요" })).toBeVisible();
  await page.getByRole("link", { name: "계정 만들기" }).click();
  await expect(page.getByRole("heading", { name: "Needex를 시작해볼까요?" })).toBeVisible();

  await page.getByLabel("이름").fill(displayName);
  await page.getByLabel("회사 이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("checkbox").first().click();
  const signupResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/signup") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /계정 만들기/ }).click();
  const signupResponse = await signupResponsePromise;
  expect(signupResponse.ok(), `${email} signup`).toBeTruthy();
  await bridgeInternalHttpSession(context, signupResponse);
  await expect(page).toHaveURL(/\/verify-email/);

  const verificationLink = await waitForMailActionLink(mailApi, email, "/verify-email");
  const verificationUrl = new URL(appUrl(appPathFromMailLink(verificationLink)));
  verificationUrl.searchParams.set("returnTo", invitationPath);
  await page.goto(verificationUrl.toString());
  await page.getByRole("button", { name: "메일 확인했어요" }).click();
  await expect(page.getByRole("heading", { name: "초대를 수락할까요?" })).toBeVisible();
  await captureCheckpoint(
    page,
    diagnostics,
    path.join(screenshotRoot, `${String(screenshotNumber).padStart(2, "0")}-${displayName.toLowerCase().replaceAll(" ", "-")}-invitation.png`),
    `${displayName} invitation`,
  );
  await page.getByRole("button", { name: "초대 수락하기" }).click();
  await page.waitForURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /안녕하세요/ })).toBeVisible();
  return { page, diagnostics };
}

test("@full-story 실제 메일과 로컬 Qwen을 거치는 requester → owner 승인 전체 여정", async ({ browser }) => {
  test.setTimeout(8 * 60_000);
  const prefix = safePrefix();
  const requesterEmail = `taskview.e2e.${prefix}.requester@example.com`;
  const ownerEmail = `taskview.e2e.${prefix}.owner@example.com`;
  const adminEmail = `taskview.e2e.${prefix}.admin@example.com`;
  const workspaceName = `Needex E2E ${prefix}`;
  const screenshotRoot = path.join("output", "verification");
  const stateRoot = path.join("output", "verification", "states", prefix);
  await Promise.all([mkdir(screenshotRoot, { recursive: true }), mkdir(stateRoot, { recursive: true })]);

  const mailApi = await playwrightRequest.newContext({ baseURL: MAILPIT_BASE_URL });
  await expectServiceReady(mailApi);

  const requesterContext = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const requesterPage = await requesterContext.newPage();
  const requesterDiagnostics = attachDiagnostics(requesterPage);
  await requesterPage.goto(appUrl("/signup"));
  await expect(requesterPage.getByRole("heading", { name: "Needex를 시작해볼까요?" })).toBeVisible();
  await requesterPage.getByLabel("이름").fill("E2E Requester");
  await requesterPage.getByLabel("회사 이메일").fill(requesterEmail);
  await requesterPage.getByLabel("비밀번호", { exact: true }).fill(password);
  await requesterPage.getByRole("checkbox").first().click();
  const requesterSignupPromise = requesterPage.waitForResponse((response) =>
    response.url().endsWith("/api/auth/signup") && response.request().method() === "POST",
  );
  await requesterPage.getByRole("button", { name: /계정 만들기/ }).click();
  const requesterSignup = await requesterSignupPromise;
  expect(requesterSignup.ok(), "requester signup").toBeTruthy();
  await bridgeInternalHttpSession(requesterContext, requesterSignup);
  await expect(requesterPage).toHaveURL(/\/verify-email/);
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "01-requester-email-pending.png"), "requester email pending");

  const requesterVerification = await waitForMailActionLink(mailApi, requesterEmail, "/verify-email");
  await requesterPage.goto(appUrl(appPathFromMailLink(requesterVerification)));
  await requesterPage.getByRole("button", { name: "메일 확인했어요" }).click();
  await requesterPage.waitForURL(/\/onboarding\/workspace/);
  await expect(requesterPage.getByRole("heading", { name: "워크스페이스를 설정해볼게요" })).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "02-workspace-setup.png"), "workspace setup");
  await requesterPage.getByLabel("워크스페이스 이름").fill(workspaceName);
  await requesterPage.getByRole("button", { name: /다음: 팀 초대/ }).click();
  await requesterPage.waitForURL(/\/onboarding\/invite/);
  await expect(requesterPage.getByRole("heading", { name: "함께 일할 팀원을 초대하세요" })).toBeVisible();
  await requesterPage.getByLabel("Data Owner 초대 이메일").fill(ownerEmail);
  await requesterPage.getByLabel("Security / Admin 초대 이메일").fill(adminEmail);
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "03-team-invitations.png"), "team invitations");
  await requesterPage.getByRole("button", { name: /초대하고 시작하기/ }).click();
  await requesterPage.waitForURL(/\/dashboard$/);
  await expect(requesterPage.getByRole("heading", { name: /안녕하세요/ })).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "04-requester-dashboard.png"), "requester dashboard");

  const [ownerInvitation, adminInvitation] = await Promise.all([
    waitForMailActionLink(mailApi, ownerEmail, "/workspace-invitations/accept"),
    waitForMailActionLink(mailApi, adminEmail, "/workspace-invitations/accept"),
  ]);

  const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const owner = await signUpFromInvitation({
    context: ownerContext,
    invitationLink: ownerInvitation,
    email: ownerEmail,
    displayName: "E2E Data Owner",
    mailApi,
    screenshotRoot,
    screenshotNumber: 5,
  });
  await captureCheckpoint(owner.page, owner.diagnostics, path.join(screenshotRoot, "06-owner-dashboard.png"), "owner dashboard");

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const admin = await signUpFromInvitation({
    context: adminContext,
    invitationLink: adminInvitation,
    email: adminEmail,
    displayName: "E2E Security Admin",
    mailApi,
    screenshotRoot,
    screenshotNumber: 7,
  });

  await requesterPage.goto(appUrl("/taskviews/new"));
  await expect(requesterPage.getByRole("heading", { name: "새 Task View 만들기" })).toBeVisible();
  const purpose = `일본 iOS 신규 사용자의 가입 이탈 원인을 개인정보 없이 분석합니다. E2E ${prefix}`;
  const purposeResponsePromise = requesterPage.waitForResponse(
    (response) => response.url().endsWith("/api/purpose/interpret") && response.request().method() === "POST",
    { timeout: 120_000 },
  );
  await requesterPage.getByLabel("업무 목적").fill(purpose);
  const purposeResponse = await purposeResponsePromise;
  expect(purposeResponse.ok(), `Qwen purpose interpretation ${purposeResponse.status()}`).toBeTruthy();
  await expect(requesterPage.getByText("실시간 해석", { exact: true })).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "08-purpose-qwen-ready.png"), "Qwen purpose interpretation");

  const previewResponsePromise = requesterPage.waitForResponse(
    (response) => response.url().endsWith("/api/taskviews/preview") && response.request().method() === "POST",
    { timeout: 120_000 },
  );
  await requesterPage.getByRole("button", { name: "데이터 탐색 시작" }).click();
  const previewResponse = await previewResponsePromise;
  expect(previewResponse.ok(), `Qwen task plan ${previewResponse.status()}`).toBeTruthy();
  const previewPayload = await previewResponse.json() as {
    plan?: { selected_sources?: string[]; assumptions?: string[] };
  };
  expect(previewPayload.plan?.selected_sources?.length, "Qwen selected source").toBeGreaterThan(0);
  expect(previewPayload.plan?.assumptions ?? []).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/로컬 모델.*실패|카탈로그 검증.*실패/)]),
  );
  await requesterPage.waitForURL(/\/taskviews\/[^/]+\/discovery$/);
  const viewMatch = new URL(requesterPage.url()).pathname.match(/^\/taskviews\/([^/]+)\/discovery$/);
  expect(viewMatch?.[1], "created Task View id").toBeTruthy();
  const viewId = decodeURIComponent(viewMatch?.[1] ?? "");
  await expect(requesterPage.getByRole("heading", { name: "관련 데이터를 찾고 있어요" })).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "09-semantic-discovery.png"), "semantic discovery");
  await requesterPage.getByRole("link", { name: /검증 시작/ }).click();
  await requesterPage.waitForURL(new RegExp(`/taskviews/${viewId}/validation$`));
  await expect(requesterPage.getByRole("heading", { name: "Task View 설계 및 검증" })).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "10-compilation-validation.png"), "compilation validation");
  await requesterPage.getByRole("button", { name: /승인 요청|안전한 대안 승인 요청/ }).click();
  await requesterPage.waitForURL(new RegExp(`/taskviews/${viewId}/approval-pending$`));
  await expect(requesterPage.getByRole("heading", { name: "승인 요청을 보냈어요" })).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "11-approval-pending.png"), "approval pending");

  await owner.page.goto(appUrl("/approvals"));
  await expect(owner.page.getByRole("heading", { name: "승인 요청" })).toBeVisible();
  await captureCheckpoint(owner.page, owner.diagnostics, path.join(screenshotRoot, "12-owner-approval-inbox.png"), "owner approval inbox");
  await owner.page.goto(appUrl(`/reviews/${encodeURIComponent(viewId)}`));
  await expect(owner.page.getByRole("heading", { name: /Data Owner Approval/ })).toBeVisible();
  await captureCheckpoint(owner.page, owner.diagnostics, path.join(screenshotRoot, "13-owner-review.png"), "owner review");
  await owner.page.getByRole("button", { name: /요청 승인|안전한 대안으로 승인/ }).click();
  await owner.page.waitForURL(new RegExp(`/taskviews/${viewId}$`));
  await expect(owner.page.getByText("APPROVED", { exact: true }).first()).toBeVisible();
  await captureCheckpoint(owner.page, owner.diagnostics, path.join(screenshotRoot, "14-owner-approved-detail.png"), "owner approved detail");

  await requesterPage.goto(appUrl(`/taskviews/${encodeURIComponent(viewId)}`));
  await expect(requesterPage.getByText("APPROVED", { exact: true }).first()).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "15-requester-approved-detail.png"), "requester approved detail");
  await requesterPage.goto(appUrl(`/taskviews/${encodeURIComponent(viewId)}/dashboard`));
  await expect(requesterPage.getByText("합성 데모 데이터 · 운영 원본 아님", { exact: true }).first()).toBeVisible();
  await captureCheckpoint(requesterPage, requesterDiagnostics, path.join(screenshotRoot, "16-approved-data-dashboard.png"), "approved data dashboard");

  const [dataResponse, analyticsResponse, taskViewResponse] = await Promise.all([
    requesterContext.request.get(appUrl(`/api/taskviews/${encodeURIComponent(viewId)}/data`)),
    requesterContext.request.get(appUrl(`/api/taskviews/${encodeURIComponent(viewId)}/analytics?period_days=7&region=all&os=all&cohort=new`)),
    requesterContext.request.get(appUrl(`/api/taskviews/${encodeURIComponent(viewId)}`)),
  ]);
  expect(dataResponse.ok(), `materialized data ${dataResponse.status()}`).toBeTruthy();
  expect(analyticsResponse.ok(), `analytics ${analyticsResponse.status()}`).toBeTruthy();
  const materialized = await dataResponse.json() as { data_origin?: string; rows?: Array<Record<string, unknown>> };
  expect(materialized.data_origin).toBe("synthetic_demo");
  expect(Array.isArray(materialized.rows)).toBeTruthy();
  for (const row of materialized.rows ?? []) {
    expect(Object.keys(row).map((key) => key.toLowerCase())).not.toEqual(expect.arrayContaining(["name", "phone", "email", "raw_ticket_text", "exact_address"]));
  }
  const analytics = await analyticsResponse.json() as { data_origin?: string };
  expect(analytics.data_origin).toBe("synthetic_demo");
  expect(taskViewResponse.ok(), `Task View detail ${taskViewResponse.status()}`).toBeTruthy();
  const taskView = await taskViewResponse.json() as { evidence?: { view_id?: string } };
  const evidenceId = taskView.evidence?.view_id;
  expect(evidenceId, "approved view evidence id").toBeTruthy();

  const requesterState = path.join(stateRoot, "requester.json");
  const ownerState = path.join(stateRoot, "owner.json");
  const adminState = path.join(stateRoot, "admin.json");
  await Promise.all([
    requesterContext.storageState({ path: requesterState }),
    ownerContext.storageState({ path: ownerState }),
    adminContext.storageState({ path: adminState }),
  ]);

  const manifest: E2EManifest = {
    prefix,
    createdAt: new Date().toISOString(),
    requesterEmail,
    ownerEmail,
    adminEmail,
    workspaceName,
    viewId,
    evidenceId: evidenceId ?? "",
    states: { requester: requesterState, owner: ownerState, admin: adminState },
  };
  await mkdir(path.join("output", "verification", "state"), { recursive: true });
  await writeFile(
    path.join("output", "verification", "state", "latest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o600 },
  );

  await Promise.all([
    requesterContext.close(),
    ownerContext.close(),
    adminContext.close(),
    mailApi.dispose(),
  ]);
});

test("@full-story API key·tenant·approval·TTL·revoke 경계", async ({ browser }) => {
  test.setTimeout(8 * 60_000);
  const manifestPath = path.join("output", "verification", "state", "latest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as E2EManifest;
  const requesterContext = await browser.newContext({ storageState: manifest.states.requester });
  const ownerContext = await browser.newContext({ storageState: manifest.states.owner });
  const adminContext = await browser.newContext({ storageState: manifest.states.admin });
  const mailApi = await playwrightRequest.newContext({ baseURL: MAILPIT_BASE_URL });

  const keyResponse = await adminContext.request.post(appUrl("/api/settings/integrations/keys"), {
    data: { name: `E2E ${manifest.prefix}` },
  });
  expect(keyResponse.status(), "admin creates API key").toBe(201);
  expect(keyResponse.headers()["cache-control"]).toBe("no-store");
  const key = await keyResponse.json() as { id: string; secret: string; scopes: string[] };
  expect(key.secret).toMatch(/^tv_live_/);
  expect(new Set(key.scopes)).toEqual(new Set([
    "taskviews:artifacts:read",
    "taskviews:data:read",
    "taskviews:analytics:read",
  ]));

  const integrationResponse = await adminContext.request.get(appUrl("/api/settings/integrations"));
  expect(integrationResponse.ok()).toBeTruthy();
  const integrations = await integrationResponse.json() as { keyMasked?: string; webhooks?: unknown[] };
  expect(integrations.keyMasked).not.toContain(key.secret);
  expect(integrations.webhooks).toEqual([]);

  const keyApi = await playwrightRequest.newContext({
    baseURL: BE_BASE_URL,
    extraHTTPHeaders: { authorization: `Bearer ${key.secret}` },
  });
  for (const suffix of ["artifacts", "data", "analytics"]) {
    const response = await keyApi.get(`/v1/taskviews/${encodeURIComponent(manifest.viewId)}/${suffix}`);
    expect(response.status(), `approved API key ${suffix}`).toBe(200);
  }

  const boundaryPreview = await requesterContext.request.post(appUrl("/api/taskviews/preview"), {
    data: {
      purpose: `한국 고객 문의를 원인별로 집계해 지원 우선순위를 결정합니다. E2E ${manifest.prefix}`,
      audience: "support",
      ttl_days: 7,
      region: "KR",
      output_mode: "dashboard_api",
    },
    timeout: 120_000,
  });
  expect(boundaryPreview.ok(), `boundary preview ${boundaryPreview.status()}`).toBeTruthy();
  const boundaryView = await boundaryPreview.json() as { id: string };
  for (const suffix of ["artifacts", "data", "analytics"]) {
    const response = await keyApi.get(`/v1/taskviews/${encodeURIComponent(boundaryView.id)}/${suffix}`);
    expect(response.status(), `unapproved API key ${suffix}`).toBe(409);
  }

  const submitted = await requesterContext.request.post(
    appUrl(`/api/taskviews/${encodeURIComponent(boundaryView.id)}/submit`),
  );
  expect(submitted.ok(), `boundary submit ${submitted.status()}`).toBeTruthy();
  const approved = await ownerContext.request.post(
    appUrl(`/api/approvals/${encodeURIComponent(boundaryView.id)}/decision`),
    { data: { decision: "approve", reason: "E2E TTL 경계 검증용 승인" } },
  );
  expect(approved.ok(), `boundary approve ${approved.status()}`).toBeTruthy();
  expect((await keyApi.get(`/v1/taskviews/${encodeURIComponent(boundaryView.id)}/data`)).status()).toBe(200);

  const crossWorkspaceEmail = `taskview.e2e.${manifest.prefix}.cross@example.com`;
  const crossContext = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const crossPage = await crossContext.newPage();
  const crossDiagnostics = attachDiagnostics(crossPage);
  await crossPage.goto(appUrl("/signup"));
  await crossPage.getByLabel("이름").fill("E2E Cross Tenant");
  await crossPage.getByLabel("회사 이메일").fill(crossWorkspaceEmail);
  await crossPage.getByLabel("비밀번호", { exact: true }).fill(password);
  await crossPage.getByRole("checkbox").first().click();
  const crossSignupPromise = crossPage.waitForResponse((response) =>
    response.url().endsWith("/api/auth/signup") && response.request().method() === "POST",
  );
  await crossPage.getByRole("button", { name: /계정 만들기/ }).click();
  const crossSignup = await crossSignupPromise;
  expect(crossSignup.ok(), "cross-workspace signup").toBeTruthy();
  await bridgeInternalHttpSession(crossContext, crossSignup);
  const crossVerification = await waitForMailActionLink(mailApi, crossWorkspaceEmail, "/verify-email");
  await crossPage.goto(appUrl(appPathFromMailLink(crossVerification)));
  await crossPage.getByRole("button", { name: "메일 확인했어요" }).click();
  await crossPage.waitForURL(/\/onboarding\/workspace/);
  await crossPage.getByLabel("워크스페이스 이름").fill(`Isolated E2E ${manifest.prefix}`);
  await crossPage.getByRole("button", { name: /다음: 팀 초대/ }).click();
  await crossPage.waitForURL(/\/onboarding\/invite/);
  await crossPage.getByRole("button", { name: "나중에 초대" }).click();
  await crossPage.waitForURL(/\/dashboard$/);
  await captureCheckpoint(
    crossPage,
    crossDiagnostics,
    path.join("output", "verification", "17-cross-workspace.png"),
    "cross workspace dashboard",
  );
  const crossPreview = await crossContext.request.post(appUrl("/api/taskviews/preview"), {
    data: {
      purpose: `격리 워크스페이스의 고객 문의 유형을 집계합니다. E2E ${manifest.prefix}`,
      audience: "product",
      ttl_days: 7,
      region: "KR",
      output_mode: "dashboard_api",
    },
    timeout: 120_000,
  });
  expect(crossPreview.ok(), `cross preview ${crossPreview.status()}`).toBeTruthy();
  const crossView = await crossPreview.json() as { id: string };
  expect(
    (await keyApi.get(`/v1/taskviews/${encodeURIComponent(crossView.id)}/data`)).status(),
    "cross-workspace API key access",
  ).toBe(404);

  expect(boundaryView.id).toMatch(/^tv_[A-Za-z0-9_-]+$/);
  await execFileAsync("psql", [
    "postgresql://taskview:taskview@postgres:5432/taskview",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `UPDATE task_views SET payload = jsonb_set(payload, '{evidence,expires_at}', '"2000-01-01T00:00:00Z"'::jsonb) WHERE id = '${boundaryView.id}'`,
  ]);
  for (const suffix of ["artifacts", "data", "analytics"]) {
    const sessionResponse = await requesterContext.request.get(
      appUrl(`/api/taskviews/${encodeURIComponent(boundaryView.id)}/${suffix}`),
    );
    const keyResponseAfterExpiry = await keyApi.get(
      `/v1/taskviews/${encodeURIComponent(boundaryView.id)}/${suffix}`,
    );
    expect(sessionResponse.status(), `expired session ${suffix}`).toBe(410);
    expect(keyResponseAfterExpiry.status(), `expired API key ${suffix}`).toBe(410);
  }

  const adminCookie = (await adminContext.cookies()).find((cookie) => cookie.name === "taskview_session");
  expect(adminCookie?.value, "admin session cookie").toBeTruthy();
  const adminApi = await playwrightRequest.newContext({
    baseURL: BE_BASE_URL,
    extraHTTPHeaders: { authorization: `Bearer ${adminCookie?.value ?? ""}` },
  });
  const revoked = await adminApi.delete(`/v1/ui/settings/integrations/keys/${encodeURIComponent(key.id)}`);
  expect(revoked.status(), "API key revoke").toBe(204);
  expect(
    (await keyApi.get(`/v1/taskviews/${encodeURIComponent(manifest.viewId)}/data`)).status(),
    "revoked key must fail immediately",
  ).toBe(401);

  const apiKeyOnUi = await keyApi.get("/v1/ui/settings/integrations");
  expect(apiKeyOnUi.status(), "API key cannot access UI endpoints").toBe(401);

  const reviewPreview = await requesterContext.request.post(appUrl("/api/taskviews/preview"), {
    data: {
      purpose: `승인 검토 화면을 위해 고객 문의 유형을 최소 필드로 집계합니다. E2E ${manifest.prefix}`,
      audience: "product",
      ttl_days: 7,
      region: "KR",
      output_mode: "dashboard_api",
    },
    timeout: 120_000,
  });
  expect(reviewPreview.ok(), `review preview ${reviewPreview.status()}`).toBeTruthy();
  const reviewView = await reviewPreview.json() as { id: string };
  const reviewSubmitted = await requesterContext.request.post(
    appUrl(`/api/taskviews/${encodeURIComponent(reviewView.id)}/submit`),
  );
  expect(reviewSubmitted.ok(), `review submit ${reviewSubmitted.status()}`).toBeTruthy();

  manifest.boundary = {
    apiKeyId: key.id,
    expiryViewId: boundaryView.id,
    reviewViewId: reviewView.id,
    crossWorkspaceEmail,
    crossWorkspaceViewId: crossView.id,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });

  await Promise.all([
    requesterContext.close(),
    ownerContext.close(),
    adminContext.close(),
    crossContext.close(),
    mailApi.dispose(),
    keyApi.dispose(),
    adminApi.dispose(),
  ]);
});