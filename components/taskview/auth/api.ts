interface ApiErrorPayload {
  detail?: unknown;
}

function readDetail(payload: ApiErrorPayload | null) {
  if (typeof payload?.detail === "string") return payload.detail;
  return null;
}

export async function postFlowJson<T>(path: string, body: unknown, unavailableMessage: string): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as (ApiErrorPayload & T) | null;

  if (!response.ok) {
    if ([404, 501, 502, 503, 504].includes(response.status)) throw new Error(unavailableMessage);
    throw new Error(readDetail(payload) ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  return payload as T;
}

export async function getFlowJson<T>(path: string, unavailableMessage: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as (ApiErrorPayload & T) | null;

  if (!response.ok) {
    if ([404, 501, 502, 503, 504].includes(response.status)) throw new Error(unavailableMessage);
    throw new Error(readDetail(payload) ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  return payload as T;
}
