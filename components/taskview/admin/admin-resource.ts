"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { requestJson } from "@/lib/client-api";
import { isNeedexDemoMode } from "@/lib/demo-mode";

export const adminEndpoints = {
  taskviews: "/api/taskviews",
  approvals: "/api/approvals",
  dataSources: "/api/data-sources",
  dataSource: (id: string) => `/api/data-sources/${encodeURIComponent(id)}`,
  dataSourceTest: "/api/data-sources/test",
  dataSourceScan: "/api/data-sources/scan",
  dataSourceComplete: "/api/data-sources/scan/complete",
  audit: "/api/audit-events",
  evidence: (id: string) => `/api/evidence-contracts/${encodeURIComponent(id)}`,
  workspace: "/api/workspace",
  workspaceNotifications: "/api/workspace/notifications",
  policy: "/api/settings/policy",
  team: "/api/members",
  integrations: "/api/settings/integrations",
  account: "/api/account",
} as const;

export function useAdminResource<T, R = T>(
  url: string,
  fixture: T,
  normalize?: (response: R) => T,
  emptyValue?: T,
) {
  const empty = emptyValue ?? (Array.isArray(fixture) ? ([] as T) : fixture);
  const [data, setData] = useState<T>(isNeedexDemoMode ? fixture : empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const fixtureRef = useRef(fixture);
  const emptyRef = useRef(empty);
  const normalizeRef = useRef(normalize);
  fixtureRef.current = fixture;
  emptyRef.current = empty;
  normalizeRef.current = normalize;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestJson<R>(url);
      setData(normalizeRef.current ? normalizeRef.current(response) : (response as unknown as T));
      setLive(true);
    } catch (cause) {
      setData(isNeedexDemoMode ? fixtureRef.current : emptyRef.current);
      setLive(false);
      setError(cause instanceof Error ? cause.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, live, demoFallback: Boolean(error && isNeedexDemoMode), reload, setData };
}

export async function sendAdminMutation<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  return requestJson<T>(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "content-type": "application/json" },
  });
}
