export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { cache: "no-store", ...init });
  const data = (await response.json().catch(() => null)) as ({ detail?: unknown } & T) | null;

  if (!response.ok) {
    const detail = data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String(item.msg).replace(/^Value error,\s*/i, "")
            : null,
        )
        .filter(Boolean);
      if (messages.length) throw new Error(messages.join(" "));
    }
    throw new Error("요청을 처리하지 못했습니다.");
  }

  return data as T;
}
