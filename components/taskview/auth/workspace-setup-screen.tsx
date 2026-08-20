"use client";

import { ArrowRight, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { postFlowJson } from "@/components/taskview/auth/api";
import {
  AuthFeedback,
  FieldLabel,
  OnboardingShell,
  SubmitButton,
  authInputClass,
} from "@/components/taskview/auth/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type WorkspaceRole = "requester" | "data_owner" | "admin";

const roles: Array<{ value: WorkspaceRole; title: string; description: string }> = [
  { value: "requester", title: "Product / UX", description: "업무 데이터를 요청하고 분석해요" },
  { value: "data_owner", title: "Data Owner / Ops", description: "데이터 공개 수준을 승인해요" },
  { value: "admin", title: "Security / Admin", description: "정책과 감사 로그를 관리해요" },
];

const roleDetails = [
  ["Product", "새 Task View와 분석 흐름 중심"],
  ["Data Owner", "승인 Inbox와 정책 근거 중심"],
  ["Security", "Policy · Audit · Source 관리 중심"],
];

export function WorkspaceSetupScreen() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("Global Product Workspace");
  const [role, setRole] = useState<WorkspaceRole>("requester");
  const [region, setRegion] = useState("KR-11");
  const [ttlDays, setTtlDays] = useState("7");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    try {
      const result = await postFlowJson<{ id?: string; workspace_id?: string }>(
        "/api/workspaces",
        {
          name: workspaceName,
          region,
          default_ttl_days: Number(ttlDays),
          member_role: role,
        },
        "워크스페이스 생성 API가 아직 연결되지 않았습니다.",
      );
      const id = result.id ?? result.workspace_id ?? "current";
      setFeedback({ tone: "success", message: "워크스페이스 기본 설정을 저장했습니다." });
      router.push(`/onboarding/invite?workspace=${encodeURIComponent(id)}`);
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "워크스페이스를 생성하지 못했습니다." });
    } finally {
      setPending(false);
    }
  }

  return (
    <OnboardingShell
      description="이 정보는 이후 Purpose 해석과 승인 경로를 기본값으로 제안하는 데 사용됩니다."
      step={1}
      title="워크스페이스를 설정해볼게요"
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <form className="min-h-[620px] rounded-[18px] border border-tv-border bg-white p-[23px]" onSubmit={submit}>
          <h2 className="text-[18px] font-bold leading-7 text-tv-ink">기본 정보</h2>

          <div className="mt-5">
            <FieldLabel htmlFor="workspace-name">워크스페이스 이름</FieldLabel>
            <Input
              className={authInputClass}
              id="workspace-name"
              maxLength={80}
              onChange={(event) => setWorkspaceName(event.target.value)}
              required
              value={workspaceName}
            />
            <p className="mt-1 text-[11px] leading-5 text-tv-slate">팀에서 공통으로 보게 되는 이름이에요.</p>
          </div>

          <fieldset className="mt-5">
            <legend className="text-[12px] font-medium leading-5 text-tv-ink">내 역할</legend>
            <div className="mt-2 grid gap-2.5">
              {roles.map((option) => {
                const selected = role === option.value;
                return (
                  <label
                    className={cn(
                      "flex min-h-[62px] cursor-pointer items-center gap-3 rounded-xl border px-3 transition-colors",
                      selected ? "border-tv-blue-200 bg-tv-blue-50" : "border-tv-border bg-white hover:bg-tv-canvas",
                    )}
                    key={option.value}
                  >
                    <input
                      checked={selected}
                      className="sr-only"
                      name="workspace-role"
                      onChange={() => setRole(option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", selected ? "border-tv-blue-500 bg-tv-blue-500 text-white" : "border-tv-border bg-white text-transparent")}>
                      <Circle aria-hidden="true" className="size-2 fill-current" strokeWidth={0} />
                    </span>
                    <span>
                      <strong className={cn("block text-[13px] leading-5", selected ? "text-tv-blue-500" : "text-tv-ink")}>{option.title}</strong>
                      <span className="block text-[11px] leading-5 text-tv-slate">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-[18px] grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div>
              <FieldLabel>기본 지역</FieldLabel>
              <Select onValueChange={setRegion} value={region}>
                <SelectTrigger aria-label="기본 지역" className="h-[46px] w-full rounded-[10px] border-tv-border bg-white px-3 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KR-11">🇰🇷 Seoul · KR</SelectItem>
                  <SelectItem value="JP-13">🇯🇵 Tokyo · JP</SelectItem>
                  <SelectItem value="VN-SG">🇻🇳 Ho Chi Minh · VN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>기본 사용 기간</FieldLabel>
              <Select onValueChange={setTtlDays} value={ttlDays}>
                <SelectTrigger aria-label="기본 사용 기간" className="h-[46px] w-full rounded-[10px] border-tv-border bg-white px-3 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3일</SelectItem>
                  <SelectItem value="7">7일</SelectItem>
                  <SelectItem value="14">14일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {feedback ? <AuthFeedback className="mt-3" tone={feedback.tone}>{feedback.message}</AuthFeedback> : null}

          <SubmitButton className="mt-[22px] gap-2" pending={pending}>
            {pending ? "저장 중…" : <>다음: 팀 초대 <ArrowRight aria-hidden="true" className="size-4" /></>}
          </SubmitButton>
        </form>

        <aside>
          <div className="min-h-[392px] rounded-[18px] bg-tv-blue-50 p-[18px]">
            <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[10px] font-medium text-tv-blue-500 sm:text-[12px]">WHY THIS MATTERS</span>
            <h2 className="mt-4 text-[20px] font-bold leading-[1.35] tracking-[-0.025em] text-tv-ink">
              역할에 따라 필요한 화면과
              <br />
              승인 책임이 달라져요.
            </h2>
            <div className="mt-7 grid gap-3.5">
              {roleDetails.map(([title, body]) => (
                <div className="min-h-[60px] rounded-xl bg-white px-3.5 py-2.5" key={title}>
                  <strong className="block text-[12px] leading-5 text-tv-blue-500">{title}</strong>
                  <span className="block text-[11px] leading-5 text-tv-gray">{body}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[11px] leading-5 text-tv-slate">나중에 설정에서 변경할 수 있어요.</p>
        </aside>
      </div>
    </OnboardingShell>
  );
}
