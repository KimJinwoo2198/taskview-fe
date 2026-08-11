import { NextResponse } from "next/server";

const backendUrl = process.env.TASKVIEW_BE_URL ?? "http://127.0.0.1:8200";

export async function proxyToBackend(path: string, init?: RequestInit) {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "TaskView BE에 연결할 수 없습니다." },
      { status: 503 },
    );
  }
}

