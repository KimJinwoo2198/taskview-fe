"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/taskview/country-flag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requestJson } from "@/lib/client-api";
import { isNeedexDemoMode } from "@/lib/demo-mode";
import type { Needex } from "@/lib/types";

import { useCoreEndpoint } from "./client";
import { coreSources } from "./fixtures";
import type { PurposeInterpretation } from "./model";
import { CoreHeading, CorePage, CorePanel, CorePill, CoreStepper, FieldTag, FooterActions, SectionHeading } from "./shared";

const examplePurposes = {
  "FCC 소비자 불만": "최근 FCC 소비자 불만에서 주·이슈 유형·접수 채널별 급증 원인을 찾아 서비스 개선 우선순위를 정하고 싶습니다.",
  "NYC 311 운영 병목": "최근 NYC 311 민원에서 borough·담당 기관·민원 유형별 처리 지연 구간을 찾아 운영 인력을 배치하고 싶습니다.",
  "NHTSA 안전 신호": "최근 NHTSA 차량 안전 불만에서 제조사·연식·부품별 사고와 화재 위험 신호를 찾아 조사 우선순위를 정하고 싶습니다.",
} as const;

function purposeSpec(purpose: string) {
  const jp = /일본|JP|Japan/i.test(purpose);
  const ios = /iOS|아이폰/i.test(purpose);
  return {
    task: /환불/.test(purpose) ? "APAC refund reason analysis" : /VOC|상담/.test(purpose) ? "JP VOC insight" : "JP signup dropoff diagnosis",
    target: `${/신규/.test(purpose) ? "new " : ""}${ios ? "iOS " : ""}users`.trim(),
    region: jp ? "JP" : "GLOBAL",
    success: /원인/.test(purpose) ? "identify top causes" : "support the requested decision",
  };
}

export function CreateCore() {
  const router = useRouter();
  const { user } = useSession();
  const [purpose, setPurpose] = useState<string>(examplePurposes["NYC 311 운영 병목"]);
  const [region, setRegion] = useState("GLOBAL");
  const [ttl, setTtl] = useState("7");
  const [output, setOutput] = useState("dashboard_api");
  const [audience, setAudience] = useState<"product" | "operations" | "support" | "executive">("operations");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<PurposeInterpretation | null>(null);
  const [interpretationState, setInterpretationState] = useState<"idle" | "loading" | "ready" | "fallback" | "error">("idle");
  const sources = useCoreEndpoint<{ sources: Array<{ id: string; flag: string; name: string; schema: string }> }>("/api/data-sources");
  const localSpec = useMemo(() => purposeSpec(purpose), [purpose]);
  const spec = interpretation ?? {
    task: localSpec.task, requester: user.display_name, target: localSpec.target, region: localSpec.region as PurposeInterpretation["region"], success: localSpec.success,
    ttl_days: Number(ttl), output_mode: output as PurposeInterpretation["output_mode"], matched_sources: [], interpreted_at: "",
    summary: purpose, subject: "업무 현황", comparison_dimensions: ["지역", "유형", "기간"], desired_outcome: "업무 개선 우선순위를 정한다",
    region_label: region === "GLOBAL" ? "전체 지역" : region, department: audience, confidence: 0.5, needs_clarification: false, clarifying_question: null,
  };
  const availableSources = sources.data?.sources.map((source) => ({ key: source.id, flag: source.flag, name: source.name, meta: source.schema })) ?? (isNeedexDemoMode ? coreSources.map((source) => ({ key: source.key, flag: source.flag, name: source.name, meta: source.meta })) : []);

  useEffect(() => {
    if (purpose.trim().length < 10) {
      setInterpretation(null);
      setInterpretationState("idle");
      return;
    }
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setInterpretationState("loading");
      void requestJson<PurposeInterpretation>("/api/purpose/interpret", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose: purpose.trim(), audience, region, ttl_days: Number(ttl), output_mode: output }),
        signal: controller.signal,
      }).then((result) => {
        if (!active) return;
        setInterpretation(result);
        setInterpretationState("ready");
      }).catch((cause) => {
        if (!active || (cause instanceof DOMException && cause.name === "AbortError")) return;
        setInterpretation(null);
        setInterpretationState(isNeedexDemoMode ? "fallback" : "error");
      });
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [audience, output, purpose, region, ttl]);

  async function startDiscovery() {
    if (purpose.trim().length < 10) {
      setError("업무 목적을 10자 이상으로 구체적으로 작성해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const view = await requestJson<Needex>("/api/taskviews/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose: purpose.trim(), audience, ttl_days: Number(ttl), region, output_mode: output }),
      });
      router.push(`/taskviews/${view.id}/discovery`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "데이터 탐색을 시작하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <CorePage className="gap-[22px] pb-8">
      <CoreHeading title="필요한 데이터 만들기" description="하려는 일을 평소 말하듯 적어주세요. 필요한 데이터는 Needex가 찾아 정리합니다." />
      <CoreStepper current={0} />

      <div className="grid min-h-[628px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <CorePanel className="min-h-[308px] p-5">
            <SectionHeading title="어떤 일을 하고 싶으세요?" description="해결할 문제, 비교할 대상, 내리고 싶은 결정을 함께 적으면 더 정확해집니다." />
            <label className="sr-only" htmlFor="purpose">업무 목적</label>
            <Textarea
              aria-describedby="purpose-help purpose-error"
              className="mt-5 min-h-[142px] resize-none rounded-[14px] border-tv-blue-200 bg-tv-canvas/30 p-4 text-[15px] font-medium leading-6 shadow-none focus-visible:border-tv-blue-500 focus-visible:ring-tv-blue-200"
              id="purpose"
              maxLength={1000}
              onChange={(event) => setPurpose(event.target.value)}
              value={purpose}
            />
            <p className="mt-2 flex items-center gap-1 text-[9px] text-tv-blue-500" id="purpose-help"><Sparkles className="size-3" /> AI가 요청 내용을 읽고, 필요한 데이터와 비교 기준을 정리합니다.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-[10px] text-tv-slate">공식 데이터 예시</span>{Object.entries(examplePurposes).map(([label, value]) => <button className="rounded-full bg-tv-subtle px-3 py-1.5 text-[10px] text-tv-slate-dark transition-colors hover:bg-tv-blue-50 hover:text-tv-blue-500" key={label} onClick={() => { setPurpose(value); setRegion("GLOBAL"); }} type="button">{label}</button>)}</div>
          </CorePanel>

          <CorePanel className="min-h-[304px] p-5">
            <SectionHeading title="기본 정보" description="소속 업무와 데이터 사용 범위를 선택해 주세요." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ContextField label="사용 부서"><Select onValueChange={(value) => setAudience(value as typeof audience)} value={audience}><SelectTrigger aria-label="사용 부서" className="h-10 w-full rounded-[10px] bg-tv-canvas text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="product">제품·기획</SelectItem><SelectItem value="operations">운영</SelectItem><SelectItem value="support">고객지원</SelectItem><SelectItem value="executive">경영·전략</SelectItem></SelectContent></Select></ContextField>
              <ContextField label="대상 지역"><Select onValueChange={setRegion} value={region}><SelectTrigger aria-label="대상 지역" className="h-10 w-full rounded-[10px] bg-tv-canvas text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="JP">Japan (JP)</SelectItem><SelectItem value="KR">Korea (KR)</SelectItem><SelectItem value="VN">Vietnam (VN)</SelectItem><SelectItem value="APAC">APAC</SelectItem><SelectItem value="GLOBAL">Global</SelectItem></SelectContent></Select></ContextField>
              <ContextField label="사용 기간"><Select onValueChange={setTtl} value={ttl}><SelectTrigger aria-label="사용 기간" className="h-10 w-full rounded-[10px] bg-tv-canvas text-[11px]"><SelectValue /></SelectTrigger><SelectContent>{[1, 3, 7, 14, 30].map((days) => <SelectItem key={days} value={String(days)}>{days}일</SelectItem>)}</SelectContent></Select></ContextField>
              <ContextField label="출력 형태"><Select onValueChange={setOutput} value={output}><SelectTrigger aria-label="출력 형태" className="h-10 w-full rounded-[10px] bg-tv-canvas text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dashboard_api">Dashboard + API</SelectItem><SelectItem value="dashboard">Dashboard</SelectItem><SelectItem value="api">API</SelectItem></SelectContent></Select></ContextField>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-tv-blue-50 px-3 py-2.5 text-[9px] leading-4 text-tv-blue-700"><Sparkles className="mt-0.5 size-3.5 shrink-0" /><p><strong className="block">원본 개인정보 접근 권한은 요청하지 않습니다.</strong>Needex는 업무 목적에 필요한 의미만 새 View로 구성합니다.</p></div>
          </CorePanel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <CorePanel className="min-h-[330px] border-tv-blue-200 bg-tv-blue-50 p-4">
            <div className="flex items-center gap-2"><h2 className="text-[16px] font-bold text-tv-ink">요청을 이렇게 이해했어요</h2><CorePill tone={interpretationState === "ready" ? "success" : interpretationState === "error" ? "danger" : "primary"}>{interpretationState === "loading" ? "정리 중…" : interpretationState === "ready" ? "자동 정리됨" : interpretationState === "error" ? "확인 필요" : "미리보기"}</CorePill></div>
            <p className={interpretationState === "error" ? "mt-2 text-[9px] text-tv-red-600" : "mt-2 text-[9px] text-tv-gray"}>{interpretationState === "error" ? "AI 연결이 원활하지 않아 기본 내용으로 표시합니다." : "내용이 맞는지 확인해 주세요. 다음 단계에서 수정할 수 있습니다."}</p>
            <dl className="mt-4 space-y-3">
              <Spec label="분석할 내용" value={spec.subject} />
              <Spec label="비교 기준" value={spec.comparison_dimensions.join(" · ")} />
              <Spec label="대상 범위" value={spec.region_label} />
              <Spec label="원하는 결과" value={spec.desired_outcome} />
            </dl>
            {spec.needs_clarification && spec.clarifying_question ? <p className="mt-3 rounded-xl bg-tv-amber-50 p-3 text-[9px] leading-4 text-tv-amber-800">조금 더 알려주세요: {spec.clarifying_question}</p> : null}
          </CorePanel>
          <CorePanel className="min-h-[282px] p-4">
            <SectionHeading title="사용할 수 있는 데이터" description="요청과 관련된 공식 공개 데이터와 연결된 사내 데이터를 확인합니다." />
            {sources.loading ? <div className="mt-4 h-[164px] animate-pulse rounded-xl bg-tv-subtle" role="status" aria-label="데이터 소스 로딩 중" /> : sources.error && !isNeedexDemoMode ? <div className="mt-4 rounded-xl border border-tv-red-200 bg-tv-red-50 p-3 text-[9px] text-tv-red-700" role="alert">{sources.error}<button className="ml-2 font-semibold underline" onClick={() => void sources.reload()} type="button">다시 시도</button></div> : availableSources.length ? <div className="mt-4 space-y-2">
              {availableSources.map((source) => (
                <div className="flex h-[52px] items-center gap-2 rounded-xl bg-tv-canvas px-3" key={source.key}>
                  <CountryFlag code={source.flag} />
                  <div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-tv-ink">{source.name}</strong><span className="block truncate text-[8px] text-tv-slate">{source.meta}</span></div>
                  <FieldTag tone="safe"><Check className="mr-1 size-3" />사용 가능</FieldTag>
                </div>
              ))}
            </div> : <p className="mt-4 rounded-xl bg-tv-canvas p-4 text-[10px] text-tv-gray">탐색 가능한 데이터 소스가 없습니다.</p>}
          </CorePanel>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-tv-red-200 bg-tv-red-50 px-4 py-3 text-[11px] text-tv-red-700" id="purpose-error" role="alert">{error}</div> : null}

      <FooterActions note="다음 단계에서 관련 데이터와 개인정보 제외 항목을 직접 확인할 수 있습니다.">
        <Button asChild className="h-11 min-w-28 rounded-[10px]" variant="outline"><Link href="/dashboard">취소</Link></Button>
        <Button className="h-11 min-w-44 rounded-[10px]" disabled={busy} onClick={() => void startDiscovery()}>{busy ? "AI가 확인 중…" : "관련 데이터 찾기"}<ArrowRight className="size-4" /></Button>
      </FooterActions>
    </CorePage>
  );
}

function ContextField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] text-tv-slate">{label}</span>{children}</label>;
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="border-l-2 border-tv-blue-200 pl-3"><dt className="text-[8px] font-bold text-tv-blue-500">{label}</dt><dd className="mt-0.5 text-[10px] font-medium text-tv-ink">{value}</dd></div>;
}
