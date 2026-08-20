import "server-only";

import { cookies } from "next/headers";

import type { ServerResult } from "./model";

const backendUrl = process.env.TASKVIEW_BE_URL ?? "http://127.0.0.1:8200";

export async function fetchNeedexBackend<T>(path: string, init?: RequestInit): Promise<ServerResult<T>> {
  const token = (await cookies()).get("taskview_session")?.value;
  if (!token) return { data: null, error: "로그인이 필요합니다.", status: 401 };
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  try {
    const response = await fetch(`${backendUrl}${path}`, { ...init, cache: "no-store", headers });
    const body = (await response.json().catch(() => null)) as ({ detail?: unknown } & T) | null;
    if (!response.ok) {
      const message = typeof body?.detail === "string" ? body.detail : "요청을 처리하지 못했습니다.";
      return { data: null, error: message, status: response.status };
    }
    return { data: body as T, error: null, status: response.status };
  } catch {
    return { data: null, error: "Needex BE에 연결할 수 없습니다.", status: 503 };
  }
}
