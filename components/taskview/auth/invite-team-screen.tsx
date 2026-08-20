"use client";

import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { postFlowJson } from "@/components/taskview/auth/api";
import {
  AuthFeedback,
  OnboardingShell,
  SubmitButton,
  authInputClass,
  secondaryCtaClass,
} from "@/components/taskview/auth/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type InviteRole = "requester" | "data_owner" | "admin";

interface InviteRowState {
  id: string;
  email: string;
  role: InviteRole;
  required: boolean;
}

const initialRows: InviteRowState[] = [
  { id: "owner", email: "", role: "data_owner", required: true },
  { id: "security", email: "", role: "admin", required: false },
  { id: "product", email: "", role: "requester", required: false },
];

const roleLabels: Record<InviteRole, string> = {
  requester: "Product / UX",
  data_owner: "Data Owner",
  admin: "Security / Admin",
};

function InviteRow({
  row,
  onChange,
  onRemove,
}: {
  row: InviteRowState;
  onChange: (next: InviteRowState) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <p className={row.required ? "mb-1 text-[11px] font-bold leading-5 text-tv-blue-500" : "mb-1 text-[11px] font-bold leading-5 text-tv-slate"}>
        {row.required ? "권장" : "선택"}
      </p>
      <div className="grid min-h-[72px] items-center gap-2 rounded-xl bg-tv-canvas p-3 sm:grid-cols-[minmax(0,1fr)_178px_102px]">
        <Input
          aria-label={`${roleLabels[row.role]} 초대 이메일`}
          className={authInputClass}
          onChange={(event) => onChange({ ...row, email: event.target.value })}
          placeholder={row.required ? "owner@company.com" : "name@company.com"}
          required={row.required}
          type="email"
          value={row.email}
        />
        <Select onValueChange={(role: InviteRole) => onChange({ ...row, role })} value={row.role}>
          <SelectTrigger aria-label="초대 역할" className="h-[46px] w-full rounded-[10px] border-tv-border bg-white px-3 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data_owner">Data Owner</SelectItem>
            <SelectItem value="admin">Security / Admin</SelectItem>
            <SelectItem value="requester">Product / UX</SelectItem>
          </SelectContent>
        </Select>
        {row.required ? (
          <span className="grid h-[46px] place-items-center rounded-[10px] border border-tv-border bg-white text-[11px] font-medium text-tv-slate">필수 역할</span>
        ) : (
          <Button aria-label={`${roleLabels[row.role]} 초대 행 삭제`} className="h-[46px] rounded-[10px] border-tv-border bg-white text-[11px] text-tv-gray hover:bg-tv-red-50 hover:text-tv-red-700" onClick={onRemove} type="button" variant="outline">
            <Trash2 aria-hidden="true" className="size-3.5 sm:hidden" />
            <span>행 삭제</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export function InviteTeamScreen({ workspaceId = "current" }: { workspaceId?: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  function updateRow(id: string, next: InviteRowState) {
    setRows((current) => current.map((row) => row.id === id ? next : row));
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { id: `invite-${Date.now()}`, email: "", role: "requester", required: false },
    ]);
  }

  async function completeOnboarding(withInvites: boolean) {
    setPending(true);
    setFeedback(null);
    try {
      if (withInvites) {
        const invitations = rows
          .filter((row) => row.email.trim())
          .map((row) => ({ email: row.email.trim(), role: row.role }));
        await postFlowJson(
          `/api/workspaces/${encodeURIComponent(workspaceId)}/invitations`,
          { invitations },
          "팀 초대 API가 아직 연결되지 않았습니다.",
        );
      }
      await postFlowJson(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/complete`,
        { skipped_invitations: !withInvites },
        "온보딩 완료 API가 아직 연결되지 않았습니다.",
      );
      setFeedback({ tone: "success", message: withInvites ? "팀 초대를 보내고 설정을 완료했습니다." : "팀 초대를 건너뛰고 설정을 완료했습니다." });
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "온보딩을 완료하지 못했습니다." });
    } finally {
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await completeOnboarding(true);
  }

  return (
    <OnboardingShell
      description="승인과 분석 역할을 나눠두면 실제 업무 흐름과 더 가깝게 사용할 수 있어요. 지금 건너뛰어도 됩니다."
      step={2}
      title="함께 일할 팀원을 초대하세요"
    >
      <form onSubmit={submit}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]">
          <section className="min-h-[590px] rounded-[18px] border border-tv-border bg-white p-[23px]">
            <h2 className="text-[18px] font-bold leading-7 text-tv-ink">팀원 초대</h2>
            <p className="text-[11px] leading-5 text-tv-slate">이메일과 역할을 선택해 초대장을 보냅니다.</p>

            <div className="mt-4 grid gap-2.5">
              {rows.map((row) => (
                <InviteRow
                  key={row.id}
                  onChange={(next) => updateRow(row.id, next)}
                  onRemove={() => removeRow(row.id)}
                  row={row}
                />
              ))}
            </div>

            <Button className="mt-5 h-[38px] rounded-[10px] border-tv-border bg-white px-4 text-[14px] text-tv-blue-500 hover:bg-tv-blue-50" disabled={rows.length >= 5} onClick={addRow} type="button" variant="outline">
              <Plus aria-hidden="true" className="size-4" /> 초대 행 추가
            </Button>

            <div className="mt-4 rounded-xl bg-tv-blue-50 px-3.5 py-3 text-[11px] leading-5 text-tv-blue-700">
              Data Owner는 고위험 요청을 승인할 수 있는 역할입니다. 실제 데모에서도 이 역할 전환을 사용합니다.
            </div>

            {feedback ? <AuthFeedback className="mt-3" tone={feedback.tone}>{feedback.message}</AuthFeedback> : null}
          </section>

          <aside className="min-h-[330px] rounded-[18px] bg-tv-blue-50 p-[18px]">
            <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[12px] font-medium text-tv-green-700">READY</span>
            <h2 className="mt-4 text-[18px] font-bold leading-7 tracking-[-0.02em] text-tv-ink">설정이 거의 끝났어요</h2>
            <ul className="mt-5 grid gap-[18px] text-[12px] font-medium text-tv-ink">
              {["워크스페이스 생성", "내 역할 설정", "기본 지역 설정"].map((label) => (
                <li className="flex items-center gap-2" key={label}>
                  <Check aria-hidden="true" className="size-[18px] text-tv-green-700" strokeWidth={2} /> {label}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[11px] leading-[1.55] text-tv-gray">
              다음부터는 대시보드에서
              <br />
              데이터 소스를 연결하고
              <br />
              Task View를 만들 수 있어요.
            </p>
          </aside>
        </div>

        <div className="mt-[22px] flex flex-col justify-end gap-3 sm:flex-row">
          <Button className={`${secondaryCtaClass} h-11 w-full sm:w-[150px]`} disabled={pending} onClick={() => void completeOnboarding(false)} type="button" variant="outline">
            나중에 초대
          </Button>
          <SubmitButton className="h-11 w-full gap-2 sm:w-[182px]" pending={pending}>
            {pending ? "설정 중…" : <>초대하고 시작하기 <ArrowRight aria-hidden="true" className="size-4" /></>}
          </SubmitButton>
        </div>
      </form>
    </OnboardingShell>
  );
}
