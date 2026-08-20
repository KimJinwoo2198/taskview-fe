"use client";

import {
  ArrowRight,
  Check,
  Database,
  RefreshCw,
  ShieldCheck,
  TableProperties,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminBadge,
  AdminEmptyState,
  AdminErrorState,
  AdminPage,
  AdminPanel,
  ApiFallbackNotice,
  DefinitionRows,
  MiniSkeleton,
  PageTitle,
  SectionHeading,
} from "@/components/taskview/admin/admin-ui";
import { adminEndpoints, sendAdminMutation, useAdminResource } from "@/components/taskview/admin/admin-resource";
import { CountryFlag } from "@/components/taskview/country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isNeedexDemoMode } from "@/lib/demo-mode";
import { cn } from "@/lib/utils";

interface DataSourceSummary {
  id: string;
  flag: string;
  name: string;
  organization: string;
  region: string;
  pii: "LOW" | "MEDIUM" | "HIGH";
  engine: string;
  schema: string;
  views: number;
  lastSync: string;
  sourceType?: "public-live" | "workspace";
  rowCount?: number;
  officialUrl?: string | null;
}

interface DataSourcesPayload {
  sources: DataSourceSummary[];
  stats: { connected: number; fields: number; pii: number; activeViews: number };
}

const figmaSources: DataSourcesPayload = {
  stats: { connected: 3, fields: 27, pii: 8, activeViews: 12 },
  sources: [
    { id: "seoul-product", flag: "🇰🇷", name: "Seoul Product DB", organization: "Product", region: "Seoul", pii: "LOW", engine: "PostgreSQL", schema: "signup_events · error_log · users", views: 5, lastSync: "12분 전" },
    { id: "tokyo-operations", flag: "🇯🇵", name: "Tokyo Operations DB", organization: "Operations", region: "Tokyo", pii: "MEDIUM", engine: "PostgreSQL", schema: "device · region · operation_issue", views: 7, lastSync: "8분 전" },
    { id: "hcmc-cs", flag: "🇻🇳", name: "Ho Chi Minh CS DB", organization: "CS", region: "HCMC", pii: "HIGH", engine: "PostgreSQL", schema: "tickets_jp · customer · agent_note", views: 4, lastSync: "5분 전" },
  ],
};
const emptySources: DataSourcesPayload = { sources: [], stats: { connected: 0, fields: 0, pii: 0, activeViews: 0 } };

export function DataSourcesScreen() {
  const { data, loading, error, demoFallback, reload } = useAdminResource<DataSourcesPayload>(adminEndpoints.dataSources, figmaSources, undefined, emptySources);
  return (
    <AdminPage>
      <PageTitle
        description="공식 공개 데이터와 조직의 원본 DB를 연결하되, Needex는 필요한 의미만 사용합니다."
        title="데이터 소스"
      />
      <Button asChild className="mt-3 h-10 w-full rounded-[10px] sm:hidden"><Link href="/data-sources/connect"><Database className="size-4" />데이터 소스 연결</Link></Button>
      {error && !demoFallback ? <div className="mt-5"><AdminErrorState message={error} onRetry={() => void reload()} /></div> : <>
      <AdminPanel className="mt-[22px] flex min-h-[110px] flex-col justify-between gap-4 border-tv-blue-200 bg-tv-blue-50 p-4 lg:flex-row lg:items-center">
        <div><h2 className="text-[15px] font-bold text-tv-blue-600">Official Public Data Map</h2><p className="mt-2 text-[10px] leading-5 text-tv-gray">FCC · NYC 311 · NHTSA 공식 데이터가 안전 필드만 남긴 PostgreSQL 스냅샷으로 연결됩니다.</p></div>
        <div className="grid gap-2 sm:grid-cols-3">
          {data.sources.slice(0, 3).map((source) => <div className="flex min-w-[142px] items-center gap-2 rounded-[10px] bg-white px-3 py-2" key={source.id}><CountryFlag code={source.flag} /><span className="min-w-0"><strong className="block truncate text-[10px] text-tv-ink">{source.name}</strong><small className="text-[8px] text-tv-slate">{source.organization}</small></span><AdminBadge className="ml-auto h-5 px-2 text-[8px]" tone="safe">LIVE</AdminBadge></div>)}
        </div>
      </AdminPanel>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataMetric label="연결된 소스" value={data.stats.connected} detail="모두 정상" />
        <DataMetric label="스키마 Field" value={data.stats.fields} detail="민감도 태그 포함" />
        <DataMetric label="PII 감지" value={data.stats.pii} detail="정책 검사 대상" />
        <DataMetric label="활성 Task View" value={data.stats.activeViews} detail="3개 소스 활용" />
      </div>
      {demoFallback ? <div className="mt-3"><ApiFallbackNotice onRetry={() => void reload()} /></div> : null}
      <div className="mt-5 space-y-3">
        {loading ? <MiniSkeleton rows={3} /> : data.sources.map((source) => <DataSourceCard key={source.id} source={source} />)}
        {!loading && !data.sources.length ? <AdminEmptyState action={<Button asChild><Link href="/data-sources/connect"><Database className="size-4" />첫 데이터 소스 연결</Link></Button>} description="읽기 전용 데이터베이스 연결을 추가하면 Catalog와 민감도를 먼저 검사합니다." title="연결된 데이터 소스가 없습니다." /> : null}
      </div>
      <p className="mt-7 text-[10px] leading-5 text-tv-slate">항목 설명과 민감도 정보를 바탕으로 업무에 맞는 데이터를 찾습니다. 이 단계에서는 원본 내용을 보여주지 않습니다.</p>
      </>}
    </AdminPage>
  );
}

function DataMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <AdminPanel className="h-[96px] px-4 py-3"><p className="text-[10px] text-tv-gray">{label}</p><div className="mt-1 flex items-end gap-4"><strong className="text-[22px] text-tv-ink">{value}</strong><span className="pb-1 text-[9px] text-tv-slate">{detail}</span></div></AdminPanel>;
}

function DataSourceCard({ source }: { source: DataSourceSummary }) {
  const tone = source.pii === "LOW" ? "success" : source.pii === "MEDIUM" ? "warning" : "danger";
  return (
    <AdminPanel className="grid min-h-[144px] gap-4 p-4 md:grid-cols-[220px_120px_90px_minmax(180px,1fr)_90px_auto] md:items-center">
      <div className="flex items-center gap-3"><CountryFlag code={source.flag} size="md" /><span><strong className="block text-[13px] text-tv-ink">{source.name}</strong><small className="text-[9px] text-tv-slate">{source.organization} · {source.region}</small></span></div>
      <div><AdminBadge className="h-5 text-[9px]" tone={tone}>PII {source.pii}</AdminBadge><p className="mt-2 flex items-center gap-1 text-[9px] font-medium text-tv-teal-700"><span className="size-1.5 rounded-full bg-tv-teal-600" />정상 연결</p></div>
      <div><p className="text-[8px] font-bold text-tv-slate">SOURCE</p><p className="mt-2 text-[10px] text-tv-ink">{source.sourceType === "public-live" ? "Official API" : source.engine}</p></div>
      <div className="min-w-0"><p className="text-[8px] font-bold text-tv-slate">SAFE SNAPSHOT</p><p className="mt-2 truncate text-[9px] text-tv-gray">{source.schema}</p><p className="mt-3 text-[8px] text-tv-slate">{source.rowCount?.toLocaleString("ko-KR") ?? 0} rows · {source.lastSync}</p></div>
      <AdminBadge className="h-5 text-[9px]" tone="primary">{source.views} views</AdminBadge>
      <Button asChild className="h-9 rounded-[10px] px-3 text-[11px] text-tv-blue-600" variant="outline"><Link href={`/data-sources/${source.id}`}>상세 보기<ArrowRight className="size-3.5" /></Link></Button>
      <div className="col-span-full flex gap-10 pl-12 text-[8px] text-tv-gray"><span className="flex items-center gap-1"><Check className="size-3 text-tv-green-700" />Catalog</span><span className="flex items-center gap-1"><Check className="size-3 text-tv-green-700" />PII scan</span><span className="flex items-center gap-1"><Check className="size-3 text-tv-green-700" />Policy</span></div>
    </AdminPanel>
  );
}

const connectionSteps = ["연결 정보", "연결 테스트", "스키마 스캔", "민감도 확인"];

function ConnectionSteps({ current }: { current: number }) {
  return (
    <AdminPanel className="mt-[18px] grid min-h-16 grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-4 sm:px-5">
      {connectionSteps.map((step, index) => <div className={cn("flex items-center gap-3 text-[11px] font-medium", index === current ? "text-tv-blue-600" : index < current ? "text-tv-green-700" : "text-tv-gray")} key={step}><span className={cn("grid size-7 place-items-center rounded-full border text-[10px]", index === current ? "border-tv-blue-500 bg-tv-blue-500 text-white" : index < current ? "border-tv-green-50 bg-tv-green-50 text-tv-green-700" : "border-tv-border bg-white")}>{index < current ? <Check className="size-3.5" /> : String(index + 1).padStart(2, "0")}</span>{step}</div>)}
    </AdminPanel>
  );
}

interface ConnectionForm {
  engine: string;
  name: string;
  organization: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

const initialConnection: ConnectionForm = { engine: "PostgreSQL", name: "Tokyo Operations DB", organization: "Operations · Tokyo · JP", host: "tokyo-ops.internal", port: "5432", database: "operations_prod", username: "taskview_reader", password: "" };
interface ConnectionTestResponse { success: boolean; read_only: boolean; tls: boolean; latency_ms: number; message: string }
interface ScanResponse { job_id: string; state: "complete"; table_count: number; field_count: number; sensitive_field_count: number; raw_rows_returned: number }
interface StoredScan { form: Omit<ConnectionForm, "password">; scan: ScanResponse; demo: boolean }
const scanStorageKey = "taskview:data-source-scan";
const demoScan: ScanResponse = { job_id: "demo-scan", state: "complete", table_count: 3, field_count: 19, sensitive_field_count: 3, raw_rows_returned: 0 };

export function ConnectDataSourceScreen() {
  const router = useRouter();
  const [form, setForm] = useState(initialConnection);
  const [testing, setTesting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const engines = ["PostgreSQL", "MySQL", "BigQuery", "Snowflake"];
  const update = (key: keyof ConnectionForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function testConnection() {
    setTesting(true);
    setConnectionError(null);
    try {
      const result = await sendAdminMutation<ConnectionTestResponse>(adminEndpoints.dataSourceTest, "POST", form);
      toast.success(`${result.message} (${result.latency_ms} ms)`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "연결 테스트에 실패했습니다.";
      setConnectionError(message);
      toast.error(message);
    } finally {
      setTesting(false);
    }
  }

  async function scanConnection() {
    if (!form.host || !form.database || !form.username) {
      toast.error("Host, Database, Username을 확인해주세요.");
      return;
    }
    setScanning(true);
    setConnectionError(null);
    try {
      const scan = await sendAdminMutation<ScanResponse>(adminEndpoints.dataSourceScan, "POST", form);
      const { password: _password, ...safeForm } = form;
      window.sessionStorage.setItem(scanStorageKey, JSON.stringify({ form: safeForm, scan, demo: false } satisfies StoredScan));
      toast.success("Catalog와 민감도 스캔을 완료했습니다.");
      router.push("/data-sources/connect/complete");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "스키마 스캔을 시작하지 못했습니다.";
      if (isNeedexDemoMode) {
        const { password: _password, ...safeForm } = form;
        window.sessionStorage.setItem(scanStorageKey, JSON.stringify({ form: safeForm, scan: demoScan, demo: true } satisfies StoredScan));
        toast.info("데모 모드의 스캔 결과를 표시합니다.");
        router.push("/data-sources/connect/complete");
      } else {
        setConnectionError(message);
        toast.error(message);
      }
    } finally {
      setScanning(false);
    }
  }

  return (
    <AdminPage>
      <PageTitle description="원본 레코드를 가져오기 전에 연결을 확인하고 스키마·민감도 메타데이터부터 스캔합니다." title="데이터 소스 연결" />
      <ConnectionSteps current={0} />
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,.8fr)]">
        <AdminPanel className="min-h-[640px] p-5">
          <SectionHeading description="읽기 전용 계정 사용을 권장합니다. 비밀번호는 화면에 다시 표시되지 않습니다." title="연결 정보" />
          <form onSubmit={(event) => { event.preventDefault(); void scanConnection(); }}>
          <div className="mt-5"><Label className="text-[10px]" id="database-engine-label">데이터베이스 유형</Label><div aria-labelledby="database-engine-label" className="mt-2 grid gap-2 sm:grid-cols-4" role="group">{engines.map((engine) => <button aria-pressed={form.engine === engine} className={cn("h-10 rounded-[10px] border text-[10px] font-semibold", form.engine === engine ? "border-tv-blue-200 bg-tv-blue-50 text-tv-blue-600" : "border-tv-border bg-white text-tv-ink hover:bg-tv-canvas")} key={engine} onClick={() => update("engine", engine)} type="button">{engine}</button>)}</div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormInput label="연결 이름" onChange={(v) => update("name", v)} value={form.name} />
            <FormInput label="조직 / 지역" onChange={(v) => update("organization", v)} value={form.organization} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_.7fr_.7fr]">
            <FormInput label="Host" onChange={(v) => update("host", v)} value={form.host} />
            <FormInput inputMode="numeric" label="Port" onChange={(v) => update("port", v)} value={form.port} />
            <FormInput label="Database" onChange={(v) => update("database", v)} value={form.database} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput label="Username" onChange={(v) => update("username", v)} value={form.username} />
            <FormInput label="Password" onChange={(v) => update("password", v)} placeholder="••••••••••••••" type="password" value={form.password} />
          </div>
          <div className="mt-5 rounded-[10px] bg-tv-blue-50 p-3 text-[10px] leading-5 text-tv-blue-600"><strong className="block">읽기 전용 연결 권장</strong>Needex는 스키마와 허용된 연산만 사용하며, LLM이 임의 SQL을 실행하지 않습니다.</div>
          {connectionError ? <div className="mt-4 rounded-[10px] border border-tv-red-200 bg-tv-red-50 px-3 py-2 text-[10px] text-tv-red-700" role="alert">{connectionError}</div> : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button className="h-11 rounded-[10px]" disabled={testing} onClick={() => void testConnection()} type="button" variant="outline"><RefreshCw className={cn("size-4", testing && "animate-spin")} />{testing ? "확인 중…" : "연결 테스트"}</Button><Button className="h-11 rounded-[10px]" disabled={scanning} type="submit">{scanning ? "스캔 중…" : "연결하고 스캔"}<ArrowRight className="size-4" /></Button></div>
          <p className="mt-4 text-[9px] text-tv-slate">SSL/TLS 사용 · Credential 암호화 저장 · 최소 권한 계정 권장</p>
          </form>
        </AdminPanel>
        <AdminPanel className="min-h-[640px] p-5">
          <SectionHeading title="연결 후 자동으로 확인해요" />
          <div className="mt-5 space-y-3">{[["연결 테스트","DB에 읽기 전용으로 접근 가능한지"],["스키마 Catalog","Table · Field · 설명을 수집"],["민감도 스캔","PII 후보와 raw text를 태깅"],["Owner 설정","누가 고위험 요청을 승인할지 지정"]].map(([title, text], index) => <div className="flex min-h-[76px] items-center gap-4 rounded-[10px] bg-tv-canvas p-3" key={title}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-tv-blue-50 text-[10px] font-bold text-tv-blue-600">{index + 1}</span><span><strong className="block text-[11px] text-tv-ink">{title}</strong><small className="mt-1 block text-[9px] text-tv-gray">{text}</small></span></div>)}</div>
          <div className="mt-5 rounded-[12px] bg-tv-blue-50 p-4"><AdminBadge className="h-5 text-[9px]" tone="primary">NO RAW PREVIEW</AdminBadge><h3 className="mt-3 text-[14px] font-bold leading-5 text-tv-ink">연결 단계에서는 원본 행을<br />미리보기로 노출하지 않아요.</h3><p className="mt-3 text-[9px] leading-4 text-tv-gray">Catalog와 민감도 태그를 먼저 만든 뒤 Purpose에 따라 필요한 연산만 실행합니다.</p></div>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}

function FormInput({ label, value, onChange, type = "text", placeholder, inputMode }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; inputMode?: "numeric" }) {
  const id = useId();
  return <label className="grid gap-2" htmlFor={id}><span className="text-[10px] font-medium text-tv-ink">{label}</span><Input autoComplete={type === "password" ? "new-password" : undefined} className="h-10 rounded-[10px] text-[11px]" id={id} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></label>;
}

interface ConnectionCompleteResponse { source_id: string; status: "connected" }

export function ScanCompleteScreen() {
  const router = useRouter();
  const [owner, setOwner] = useState("Tokyo Operations");
  const [region, setRegion] = useState("Japan (JP)");
  const [stored, setStored] = useState<StoredScan | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(scanStorageKey);
    if (raw) {
      try { setStored(JSON.parse(raw) as StoredScan); } catch { window.sessionStorage.removeItem(scanStorageKey); }
    } else if (isNeedexDemoMode) {
      const { password: _password, ...safeForm } = initialConnection;
      setStored({ form: safeForm, scan: demoScan, demo: true });
    }
    setReady(true);
  }, []);

  async function complete() {
    const currentScan = stored;
    if (!currentScan) {
      setSaveError("완료할 스캔 결과가 없습니다. 연결 화면에서 다시 스캔해 주세요.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await sendAdminMutation<ConnectionCompleteResponse>(adminEndpoints.dataSourceComplete, "POST", { job_id: currentScan.scan.job_id, owner, region, policy: "default-safe" });
      window.sessionStorage.removeItem(scanStorageKey);
      toast.success("데이터 소스를 연결했습니다.");
      router.push(`/data-sources/${encodeURIComponent(result.source_id)}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "데이터 소스 연결을 완료하지 못했습니다.";
      if (isNeedexDemoMode && currentScan.demo) {
        window.sessionStorage.removeItem(scanStorageKey);
        toast.info("데모 데이터 소스 상세를 엽니다.");
        router.push("/data-sources/tokyo-operations");
      } else {
        setSaveError(message);
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <AdminPage><MiniSkeleton rows={6} /></AdminPage>;
  if (!stored) return <AdminPage><PageTitle description="완료된 스캔 결과가 있을 때만 연결을 확정할 수 있습니다." title="스캔 결과를 찾을 수 없습니다." /><div className="mt-5"><AdminErrorState message="연결 정보 화면에서 연결 테스트와 스키마 스캔을 다시 실행해 주세요." /></div><Button asChild className="mt-4"><Link href="/data-sources/connect">연결 화면으로 돌아가기</Link></Button></AdminPage>;

  const { scan, form, demo } = stored;
  return (
    <AdminPage>
      <PageTitle badge={<AdminBadge tone="success">CONNECTION SECURE</AdminBadge>} description="원본 행을 노출하지 않고 Catalog와 민감도 메타데이터를 만들었습니다." title="스키마 스캔이 완료됐어요" />
      <ConnectionSteps current={3} />
      {demo ? <div className="mt-4"><ApiFallbackNotice message="데모 모드의 합성 스캔 결과입니다. 운영 연결 결과가 아닙니다." /></div> : null}
      <AdminPanel className="mt-5 flex min-h-[86px] flex-col justify-between gap-3 border-tv-green-50 bg-tv-green-50 px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Check className="size-5 text-tv-green-700" /><span><strong className="block text-[14px] text-tv-ink">{form.name} 스캔 성공</strong><small className="text-[9px] text-tv-gray">{form.engine} · raw rows {scan.raw_rows_returned} · job {scan.job_id}</small></span></div><div className="flex gap-2"><AdminBadge tone="success">READ ONLY</AdminBadge><AdminBadge tone="success">NO RAW ROWS</AdminBadge></div></AdminPanel>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,.8fr)]">
        <AdminPanel className="min-h-[532px] p-4"><SectionHeading description={`${scan.table_count} tables · ${scan.field_count} fields · 민감 필드 ${scan.sensitive_field_count}개 감지`} title="스캔 결과" /><div className="mt-5 grid gap-3 sm:grid-cols-3"><DataMetric detail="Catalog" label="테이블" value={scan.table_count} /><DataMetric detail="Semantic fields" label="필드" value={scan.field_count} /><DataMetric detail="Policy 대상" label="민감 필드" value={scan.sensitive_field_count} /></div>{demo ? <><div className="mt-5 space-y-3">{[["user_context","8 fields","2 sensitive","warning"],["operation_issue","6 fields","0 sensitive","success"],["device_profile","5 fields","1 sensitive","warning"]].map(([name, fields, count, tone]) => <div className="flex h-[66px] items-center justify-between rounded-[10px] bg-tv-canvas px-4" key={name}><span><strong className="block text-[11px] text-tv-ink">{name}</strong><small className="text-[9px] text-tv-gray">{fields}</small></span><AdminBadge className="w-[92px]" tone={tone as "warning" | "success"}>{count}</AdminBadge></div>)}</div></> : <div className="mt-5 rounded-[10px] bg-tv-canvas p-4 text-[10px] leading-5 text-tv-gray">연결 API는 안전을 위해 집계된 Catalog 수치만 반환했습니다. 테이블·필드 상세는 연결 완료 후 소스 상세 화면에서 조회합니다.</div>}<div className="mt-5 rounded-[10px] border border-tv-green-50 bg-tv-green-50 p-4 text-[10px] text-tv-green-700">원본 행 반환: {scan.raw_rows_returned} · 스캔 상태: {scan.state}</div></AdminPanel>
        <AdminPanel className="min-h-[532px] p-4"><SectionHeading description="Data Owner와 기본 정책을 지정하면 연결이 완료됩니다." title="마지막 확인" /><div className="mt-5 space-y-4"><label className="grid gap-2 text-[10px] font-medium">Data Owner<Select onValueChange={setOwner} value={owner}><SelectTrigger aria-label="Data Owner" className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tokyo Operations">Tokyo Operations</SelectItem><SelectItem value="Security Admin">Security Admin</SelectItem></SelectContent></Select></label><label className="grid gap-2 text-[10px] font-medium">기본 지역<Select onValueChange={setRegion} value={region}><SelectTrigger aria-label="기본 지역" className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Japan (JP)">Japan (JP)</SelectItem><SelectItem value="Seoul (KR)">Seoul (KR)</SelectItem></SelectContent></Select></label></div><div className="mt-5 rounded-[10px] bg-tv-blue-50 p-3 text-[9px] leading-6 text-tv-blue-600">✓ PII 후보 자동 태깅<br />✓ raw text 기본 DENY<br />✓ Catalog metadata만 AI 탐색에 사용</div>{saveError ? <div className="mt-4 rounded-[10px] border border-tv-red-200 bg-tv-red-50 p-3 text-[10px] text-tv-red-700" role="alert">{saveError}</div> : null}<Button className="mt-5 h-11 w-full rounded-[10px]" disabled={saving} onClick={() => void complete()}>{saving ? "저장 중…" : "데이터 소스 연결 완료"}<ArrowRight className="size-4" /></Button><Button asChild className="mt-2 h-10 w-full rounded-[10px]" variant="outline"><Link href="/data-sources/connect">연결 정보 수정</Link></Button></AdminPanel>
      </div>
      <p className="mt-7 text-[10px] text-tv-slate">연결 후 상세 화면에서 Field 의미와 민감도 태그를 확인할 수 있습니다.</p>
    </AdminPage>
  );
}

interface CatalogField { field: string; meaning: string; sensitivity: "INDIRECT" | "HIGH" | "MEDIUM" | "LOW"; transform: string }
interface SourceDetailPayload {
  name: string;
  flag: string;
  subtitle: string;
  owner: string;
  region: string;
  fields: CatalogField[];
}

const figmaSourceDetail: SourceDetailPayload = {
  name: "Tokyo Operations DB", flag: "🇯🇵", subtitle: "Operations · Tokyo · JP · PostgreSQL", owner: "Tokyo Operations", region: "Japan (JP)",
  fields: [
    { field: "user_id", meaning: "Internal user key", sensitivity: "INDIRECT", transform: "TOKENIZE" },
    { field: "exact_address", meaning: "User detailed address", sensitivity: "HIGH", transform: "GENERALIZE" },
    { field: "birth_date", meaning: "Date of birth", sensitivity: "MEDIUM", transform: "BUCKET" },
    { field: "region", meaning: "Operating region", sensitivity: "LOW", transform: "SELECT" },
    { field: "device", meaning: "Device family", sensitivity: "LOW", transform: "SELECT" },
    { field: "os_version", meaning: "OS version", sensitivity: "LOW", transform: "SELECT" },
    { field: "operation_issue", meaning: "Ops issue code", sensitivity: "LOW", transform: "CATEGORY" },
    { field: "locale", meaning: "Locale / language", sensitivity: "LOW", transform: "SELECT" },
  ],
};
const emptySourceDetail: SourceDetailPayload = { name: "", flag: "", subtitle: "", owner: "", region: "", fields: [] };

export function DataSourceDetailScreen({ sourceId }: { sourceId: string }) {
  const { data, loading, error, demoFallback, reload } = useAdminResource<SourceDetailPayload>(adminEndpoints.dataSource(sourceId), figmaSourceDetail, undefined, emptySourceDetail);
  const [table, setTable] = useState("catalog");
  const shownFields = useMemo(() => data.fields, [data.fields]);
  const piiLevel = shownFields.some((field) => field.sensitivity === "HIGH") ? "HIGH" : shownFields.some((field) => field.sensitivity === "MEDIUM" || field.sensitivity === "INDIRECT") ? "MEDIUM" : "LOW";
  if (loading) return <AdminPage><MiniSkeleton rows={8} /></AdminPage>;
  if (error && !demoFallback) return <AdminPage><PageTitle description="접근 권한이나 데이터 소스 ID를 확인해 주세요." title="데이터 소스를 열 수 없습니다." /><div className="mt-5"><AdminErrorState message={error} onRetry={() => void reload()} /></div></AdminPage>;
  return (
    <AdminPage>
      <AdminPanel className="flex min-h-[120px] flex-col justify-between gap-4 border-tv-blue-200 bg-tv-blue-50 p-4 md:flex-row md:items-center"><div className="flex items-center gap-4"><CountryFlag code={data.flag} size="lg" /><div><h1 className="text-[21px] font-bold text-tv-ink">{data.name}</h1><p className="mt-1 text-[10px] text-tv-gray">{data.subtitle}</p><div className="mt-2 flex gap-2"><AdminBadge className="h-5" tone="safe">CONNECTED</AdminBadge><AdminBadge className="h-5" tone={piiLevel === "HIGH" ? "danger" : piiLevel === "MEDIUM" ? "warning" : "success"}>PII {piiLevel}</AdminBadge></div></div></div><DefinitionRows className="grid gap-x-8 gap-y-3 sm:grid-cols-3 sm:space-y-0" rows={[["연결 상태","정상"],["Data Owner",data.owner],["Catalog Field",`${data.fields.length}개`]]} /></AdminPanel>
      {demoFallback ? <div className="mt-3"><ApiFallbackNotice onRetry={() => void reload()} /></div> : null}
      <Tabs className="min-w-0 mt-5" defaultValue="catalog"><TabsList aria-label="데이터 소스 상세" className="h-12 w-full justify-start overflow-x-auto rounded-[10px] bg-tv-canvas p-1 tv-scrollbar"><TabsTrigger className="max-w-36 px-4 text-[11px]" value="catalog">Schema Catalog</TabsTrigger><TabsTrigger className="max-w-28 px-4 text-[11px]" value="connection">Connection</TabsTrigger><TabsTrigger className="max-w-24 px-4 text-[11px]" value="usage">Usage</TabsTrigger><TabsTrigger className="max-w-32 px-4 text-[11px]" value="policy">Access Policy</TabsTrigger></TabsList>
        <TabsContent className="mt-5" value="catalog"><div className="grid min-h-[646px] gap-3 xl:grid-cols-[178px_minmax(0,1fr)_202px]">
          <AdminPanel className="p-3"><h2 className="text-[14px] font-bold">Catalog</h2><button aria-pressed={table === "catalog"} className="mt-3 w-full rounded-[8px] bg-tv-blue-50 px-3 py-2 text-left text-tv-blue-600" onClick={() => setTable("catalog")} type="button"><strong className="block text-[10px]">전체 필드</strong><small className="text-[8px] text-tv-slate">{data.fields.length} fields</small></button></AdminPanel>
          <AdminPanel className="overflow-hidden"><div className="p-4"><h2 className="text-[14px] font-bold">Schema semantic catalog</h2><p className="text-[9px] text-tv-gray">API가 반환한 실제 Field 의미와 정책 변환입니다.</p></div>{shownFields.length ? <div className="overflow-x-auto"><div className="min-w-[560px]"><div className="grid h-10 grid-cols-[150px_210px_110px_110px] items-center bg-tv-canvas px-3 text-[8px] font-bold text-tv-slate"><span>FIELD</span><span>MEANING</span><span>SENSITIVITY</span><span>TRANSFORM</span></div>{shownFields.map((field) => <div className="grid h-[60px] grid-cols-[150px_210px_110px_110px] items-center border-t border-tv-border px-3 text-[9px]" key={field.field}><strong>{field.field}</strong><span className="text-tv-gray">{field.meaning}</span><AdminBadge className="h-5 justify-self-start text-[9px]" tone={field.sensitivity === "HIGH" ? "danger" : field.sensitivity === "LOW" ? "success" : "warning"}>{field.sensitivity}</AdminBadge><span className="font-medium text-tv-teal-700">{field.transform}</span></div>)}</div></div> : <AdminEmptyState description="스캔 후 필드가 발견되면 이곳에 표시됩니다." title="Catalog 필드가 없습니다." />}</AdminPanel>
          <div className="space-y-3"><AdminPanel className="p-4"><SectionHeading title="Semantic Metadata" /><DefinitionRows className="mt-5" rows={[["Owner",data.owner],["Region",data.region],["Field count",String(data.fields.length)],["Sensitive",String(data.fields.filter((field) => field.sensitivity !== "LOW").length)],["Raw export",<span className="text-tv-red-700" key="deny">DENY</span>]]} /></AdminPanel><AdminPanel className="p-4"><AdminBadge tone="success">SCAN COMPLETE</AdminBadge><p className="mt-3 text-[9px] text-tv-gray">{data.fields.length} fields · {data.fields.filter((field) => field.sensitivity !== "LOW").length} sensitive</p><Button className="mt-3 h-8 w-full text-[10px]" disabled title="재스캔 API 계약 준비 중" variant="outline"><RefreshCw className="size-3" />다시 스캔 · 준비 중</Button></AdminPanel></div>
        </div></TabsContent>
        <TabsContent className="mt-5" value="connection"><AdminPanel className="min-h-[420px] p-5"><SectionHeading description="Credential 값은 보안상 다시 표시하지 않습니다." title="Connection" /><DefinitionRows className="mt-6" rows={[["상태",<AdminBadge key="status" tone="success">CONNECTED</AdminBadge>],["Engine",data.subtitle.split(" · ").at(-1) ?? "—"],["Organization",data.subtitle],["Region",data.region],["Data Owner",data.owner],["Credential","암호화 저장 · 화면 비노출"]]} /></AdminPanel></TabsContent>
        <TabsContent className="mt-5" value="usage"><AdminEmptyState description="이 데이터 소스를 사용한 Task View 목록 API 계약이 준비되면 여기에 표시됩니다." title="사용 내역 준비 중" /></TabsContent>
        <TabsContent className="mt-5" value="policy"><AdminPanel className="min-h-[420px] p-5"><SectionHeading description="Catalog 스캔에서 확인한 실제 민감도와 기본 변환입니다." title="Access Policy" /><div className="mt-5 divide-y divide-tv-border">{shownFields.map((field) => <div className="grid min-h-12 grid-cols-[1fr_100px_130px] items-center gap-4 text-[10px]" key={field.field}><strong>{field.field}</strong><AdminBadge className="h-5 justify-self-start" tone={field.sensitivity === "HIGH" ? "danger" : field.sensitivity === "LOW" ? "success" : "warning"}>{field.sensitivity}</AdminBadge><span className="font-medium text-tv-teal-700">{field.transform}</span></div>)}</div></AdminPanel></TabsContent>
      </Tabs>
    </AdminPage>
  );
}
