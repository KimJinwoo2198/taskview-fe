import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backendUrl = process.env.TASKVIEW_BE_URL ?? "http://127.0.0.1:8200";
const sessionCookie = "taskview_session";
const oauthStateCookie = "taskview_oauth_state";

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
  const headers = new Headers();
  for (const name of ["cache-control", "pragma"] as const) {
    const value = result.response.headers.get(name);
    if (value) headers.set(name, value);
  }
  const init = { status: result.response.status, headers };
  if (result.body === null) return new NextResponse(null, init);
  return NextResponse.json(result.body, init);
}

function unavailableResponse() {
  return NextResponse.json({ detail: "Needex BE에 연결할 수 없습니다." }, { status: 503 });
}

function expireSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
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

export async function proxyAuthenticatedDownload(path: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) {
    return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    const headers = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control", "pragma", "x-content-type-options"] as const) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(response.body, { status: response.status, headers });
  } catch {
    return unavailableResponse();
  }
}

export async function getBrowserSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return NextResponse.json(null);
  try {
    const result = await callBackend("/v1/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (result.response.status !== 401) return toNextResponse(result);
    const response = NextResponse.json(null);
    expireSessionCookie(response);
    return response;
  } catch {
    return unavailableResponse();
  }
}

export async function establishSession(
  path: "/v1/auth/signup" | "/v1/auth/login" | "/v1/auth/password-resets",
  body: string,
) {
  try {
    const result = await callBackend(path, { method: "POST", body });
    if (!result.response.ok || !result.body || typeof result.body !== "object") {
      return toNextResponse(result);
    }
    const payload = result.body as {
      user: unknown;
      session_token: string;
      expires_at: string;
      next_path?: string;
      verification_token?: string | null;
    };
    const response = NextResponse.json(
      {
        user: payload.user,
        next_path: payload.next_path ?? "/dashboard",
        verification_token: payload.verification_token ?? null,
      },
      { status: result.response.status },
    );
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
  expireSessionCookie(response);
  return response;
}

export async function beginGoogleOAuth(request: Request) {
  try {
    const result = await callBackend("/v1/auth/oauth/google/start");
    if (
      !result.response.ok ||
      !result.body ||
      typeof result.body !== "object" ||
      !("authorization_url" in result.body) ||
      typeof result.body.authorization_url !== "string"
    ) {
      return NextResponse.redirect(new URL("/login?oauth_error=unavailable", request.url));
    }
    const authorizationUrl = new URL(result.body.authorization_url);
    const state = authorizationUrl.searchParams.get("state");
    if (!state) {
      return NextResponse.redirect(new URL("/login?oauth_error=unavailable", request.url));
    }
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(oauthStateCookie, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google/callback",
      maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?oauth_error=unavailable", request.url));
  }
}

export async function completeGoogleOAuth(request: Request) {
  const input = new URL(request.url).searchParams;
  const code = input.get("code");
  const state = input.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?oauth_error=invalid_callback", request.url));
  }
  const cookieStore = await cookies();
  const boundState = cookieStore.get(oauthStateCookie)?.value;
  const stateMatches = (() => {
    if (!boundState) return false;
    const expected = Buffer.from(boundState);
    const actual = Buffer.from(state);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  })();
  if (!stateMatches) {
    const response = NextResponse.redirect(new URL("/login?oauth_error=state_mismatch", request.url));
    response.cookies.set(oauthStateCookie, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth/google/callback",
      expires: new Date(0),
    });
    return response;
  }
  const query = new URLSearchParams({ code, state });
  try {
    const result = await callBackend(`/v1/auth/oauth/google/callback?${query.toString()}`);
    if (!result.response.ok || !result.body || typeof result.body !== "object") {
      const response = NextResponse.redirect(new URL("/login?oauth_error=failed", request.url));
      response.cookies.set(oauthStateCookie, "", { path: "/api/auth/google/callback", expires: new Date(0) });
      return response;
    }
    const payload = result.body as {
      session_token?: unknown;
      expires_at?: unknown;
      next_path?: unknown;
    };
    if (typeof payload.session_token !== "string" || typeof payload.expires_at !== "string") {
      const response = NextResponse.redirect(new URL("/login?oauth_error=failed", request.url));
      response.cookies.set(oauthStateCookie, "", { path: "/api/auth/google/callback", expires: new Date(0) });
      return response;
    }
    const nextPath =
      typeof payload.next_path === "string" && payload.next_path.startsWith("/") && !payload.next_path.startsWith("//")
        ? payload.next_path
        : "/dashboard";
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set(sessionCookie, payload.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(payload.expires_at),
    });
    response.cookies.set(oauthStateCookie, "", { path: "/api/auth/google/callback", expires: new Date(0) });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login?oauth_error=failed", request.url));
    response.cookies.set(oauthStateCookie, "", { path: "/api/auth/google/callback", expires: new Date(0) });
    return response;
  }
}
