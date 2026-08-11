import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backendUrl = process.env.TASKVIEW_BE_URL ?? "http://127.0.0.1:8200";
const sessionCookie = "taskview_session";

interface BackendResult {
  response: Response;
  body: unknown;
}

async function callBackend(path: string, init?: RequestInit): Promise<BackendResult> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: "백엔드가 해석할 수 없는 응답을 반환했습니다." };
    }
  }
  return { response, body };
}

function toNextResponse(result: BackendResult) {
  if (result.body === null) return new NextResponse(null, { status: result.response.status });
  return NextResponse.json(result.body, { status: result.response.status });
}

function unavailableResponse() {
  return NextResponse.json({ detail: "TaskView BE에 연결할 수 없습니다." }, { status: 503 });
}

export function rejectCrossSiteMutation(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const requestHost =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      new URL(request.url).host;
    if (new URL(origin).host === requestHost) return null;
  } catch {
    // Invalid origins are rejected below.
  }
  return NextResponse.json({ detail: "교차 사이트 요청은 허용되지 않습니다." }, { status: 403 });
}

export async function proxyToBackend(path: string, init?: RequestInit) {
  try {
    return toNextResponse(await callBackend(path, init));
  } catch {
    return unavailableResponse();
  }
}

export async function proxyAuthenticatedToBackend(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  try {
    return toNextResponse(await callBackend(path, { ...init, headers }));
  } catch {
    return unavailableResponse();
  }
}

export async function establishSession(path: "/v1/auth/signup" | "/v1/auth/login", body: string) {
  try {
    const result = await callBackend(path, { method: "POST", body });
    if (!result.response.ok || !result.body || typeof result.body !== "object") {
      return toNextResponse(result);
    }
    const payload = result.body as {
      user: unknown;
      session_token: string;
      expires_at: string;
    };
    const response = NextResponse.json({ user: payload.user }, { status: result.response.status });
    response.cookies.set(sessionCookie, payload.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(payload.expires_at),
    });
    return response;
  } catch {
    return unavailableResponse();
  }
}

export async function refreshBrowserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  try {
    const result = await callBackend("/v1/auth/session/refresh", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!result.response.ok || !result.body || typeof result.body !== "object") {
      return toNextResponse(result);
    }
    const payload = result.body as {
      user: unknown;
      session_token: string;
      expires_at: string;
    };
    const response = NextResponse.json({ user: payload.user });
    response.cookies.set(sessionCookie, payload.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(payload.expires_at),
    });
    return response;
  } catch {
    return unavailableResponse();
  }
}

export async function destroyBrowserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    try {
      await callBackend("/v1/auth/logout", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
    } catch {
      // The browser session is removed even if the backend is temporarily unavailable.
    }
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
