"use client";

import { useCallback, useEffect, useState } from "react";

import { requestJson } from "@/lib/client-api";
import { isNeedexDemoMode } from "@/lib/demo-mode";
import type { Needex } from "@/lib/types";

import { demoView } from "./fixtures";
import type { CoreViewState } from "./model";

export function useCoreNeedex(viewId: string) {
  const placeholder = { ...demoView, id: viewId || "unavailable", purpose: "", preview_rows: [] };
  const [state, setState] = useState<CoreViewState>({ view: isNeedexDemoMode ? { ...demoView, id: viewId || "demo" } : placeholder, isFallback: isNeedexDemoMode, error: null });
  const [loading, setLoading] = useState(viewId !== "demo");

  const reload = useCallback(async () => {
    if (!viewId || viewId === "demo") {
      setState(isNeedexDemoMode
        ? { view: demoView, isFallback: true, error: null }
        : { view: placeholder, isFallback: false, error: "데모 화면은 NEXT_PUBLIC_TASKVIEW_DEMO_MODE=true에서만 사용할 수 있습니다." });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const view = await requestJson<Needex>(`/api/taskviews/${encodeURIComponent(viewId)}`);
      setState({ view, isFallback: false, error: null });
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : "Task View를 불러오지 못했습니다.";
      setState(isNeedexDemoMode
        ? { view: { ...demoView, id: viewId }, isFallback: true, error }
        : { view: placeholder, isFallback: false, error });
    } finally {
      setLoading(false);
    }
  }, [viewId]);

  useEffect(() => { void reload(); }, [reload]);
  return { ...state, loading, reload };
}

export function useCoreEndpoint<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await requestJson<T>(path));
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
