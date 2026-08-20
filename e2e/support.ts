import { expect, type APIRequestContext, type BrowserContext, type Page, type Response } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export const FE_BASE_URL = process.env.TASKVIEW_E2E_FE_URL ?? "http://fe:3000";
export const BE_BASE_URL = process.env.TASKVIEW_E2E_BE_URL ?? "http://be:8200";
export const MAILPIT_BASE_URL = process.env.TASKVIEW_E2E_MAILPIT_URL ?? "http://mailpit:8025";
export const VIEWPORT = { width: 1440, height: 1024 } as const;

type DiagnosticState = {
  consoleErrors: string[];
  pageErrors: string[];
};

export type E2EManifest = {
  prefix: string;
  createdAt: string;
  requesterEmail: string;
  ownerEmail: string;
  adminEmail: string;
  workspaceName: string;
  viewId: string;
  evidenceId: string;
  states: {
    requester: string;
    owner: string;
    admin: string;
  };
  boundary?: {
    apiKeyId: string;
    expiryViewId: string;
    reviewViewId: string;
    crossWorkspaceEmail: string;
    crossWorkspaceViewId: string;
  };
};

export function attachDiagnostics(page: Page) {
  const state: DiagnosticState = { consoleErrors: [], pageErrors: [] };
  page.on("console", (message) => {
    if (message.type() === "error") state.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => state.pageErrors.push(error.message));
  return state;
}

export async function assertPageHealthy(page: Page, diagnostics: DiagnosticState, label: string) {
  await page.evaluate(async () => {
    if ("fonts" in document) await document.fonts.ready;
  });
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(
    Math.max(overflow.document, overflow.body),
    `${label}: document-level horizontal overflow`,
  ).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(diagnostics.pageErrors, `${label}: pageerror`).toEqual([]);
  expect(diagnostics.consoleErrors, `${label}: console.error`).toEqual([]);
  diagnostics.pageErrors.length = 0;
  diagnostics.consoleErrors.length = 0;
}

export async function captureCheckpoint(
  page: Page,
  diagnostics: DiagnosticState,
  outputPath: string,
  label: string,
) {
  await page.waitForTimeout(250);
  await assertPageHealthy(page, diagnostics, label);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: false });
}

export function appUrl(pathname: string) {
  return new URL(pathname, FE_BASE_URL).toString();
}

export function appPathFromMailLink(link: string) {
  const url = new URL(link);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function bridgeInternalHttpSession(context: BrowserContext, response: Response) {
  const setCookie = await response.headerValue("set-cookie");
  expect(setCookie, "BFF signup response must set a session cookie").toBeTruthy();
  expect(setCookie?.toLowerCase()).toContain("httponly");
  expect(setCookie?.toLowerCase()).toContain("samesite=lax");

  const payload = await response.json() as Record<string, unknown>;
  expect(payload).not.toHaveProperty("session_token");

  const match = setCookie?.match(/(?:^|[,;]\s*)taskview_session=([^;]+)/);
  expect(match?.[1], "taskview_session value was not found in Set-Cookie").toBeTruthy();

  const target = new URL(FE_BASE_URL);
  const isPlainInternalHttp = target.protocol === "http:" && !["localhost", "127.0.0.1", "::1"].includes(target.hostname);
  if (isPlainInternalHttp) {
    // Production emits Secure cookies. Docker's service name (`fe`) is intentionally
    // reached over an isolated HTTP network, so Chromium cannot persist that cookie.
    // Mirror the same opaque value as an HttpOnly, non-Secure test transport cookie.
    await context.addCookies([{
      name: "taskview_session",
      value: decodeURIComponent(match?.[1] ?? ""),
      url: FE_BASE_URL,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    }]);
  }
}

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringsIn);
  return [];
}

function mailItems(value: unknown): Array<Record<string, unknown>> {
  if (!value || typeof value !== "object") return [];
  const payload = value as Record<string, unknown>;
  const candidate = payload.messages ?? payload.Messages;
  return Array.isArray(candidate)
    ? candidate.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
}

export async function waitForMailActionLink(
  api: APIRequestContext,
  recipient: string,
  actionPath: "/verify-email" | "/workspace-invitations/accept",
  timeoutMs = 45_000,
) {
  const deadline = Date.now() + timeoutMs;
  const recipientLower = recipient.toLowerCase();
  const escapedPath = actionPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkPattern = new RegExp(`https?://[^\\s<>"']+${escapedPath}\\?token=[A-Za-z0-9_-]+`);

  while (Date.now() < deadline) {
    const listResponse = await api.get(`${MAILPIT_BASE_URL}/api/v1/messages?limit=100`);
    if (listResponse.ok()) {
      const items = mailItems(await listResponse.json());
      for (const item of items) {
        if (!stringsIn(item.To ?? item.to).join(" ").toLowerCase().includes(recipientLower)) continue;
        const id = item.ID ?? item.Id ?? item.id;
        if (typeof id !== "string") continue;
        const detailResponse = await api.get(`${MAILPIT_BASE_URL}/api/v1/message/${encodeURIComponent(id)}`);
        if (!detailResponse.ok()) continue;
        const detailText = stringsIn(await detailResponse.json()).join("\n");
        const match = detailText.match(linkPattern);
        if (match?.[0]) return match[0].replaceAll("&amp;", "&");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${recipient} 수신함에서 ${actionPath} 링크를 ${timeoutMs}ms 안에 찾지 못했습니다.`);
}

export async function expectServiceReady(api: APIRequestContext) {
  const [fe, be, mailpit] = await Promise.all([
    api.get(`${FE_BASE_URL}/api/health`),
    api.get(`${BE_BASE_URL}/health`),
    api.get(`${MAILPIT_BASE_URL}/api/v1/messages?limit=1`),
  ]);
  expect(fe.ok(), `FE health ${fe.status()}`).toBeTruthy();
  expect(be.ok(), `BE health ${be.status()}`).toBeTruthy();
  expect(mailpit.ok(), `Mailpit health ${mailpit.status()}`).toBeTruthy();
}

export function safePrefix(input = process.env.TASKVIEW_E2E_PREFIX) {
  const fallback = `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
  const normalized = (input || fallback).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 32);
  if (!normalized) throw new Error("TASKVIEW_E2E_PREFIX에 영문 소문자, 숫자, _ 또는 -를 넣어주세요.");
  return normalized;
}
