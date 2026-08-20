import type { Metadata } from "next";
import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";

import { InvitationAcceptScreen } from "@/components/taskview/auth/invitation-accept-screen";
import { AuthPageShell } from "@/components/taskview/auth/shared";

export const metadata: Metadata = {
  title: "워크스페이스 초대 | Needex",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function InvitationPageFallback() {
  return (
    <AuthPageShell
      cardClassName="min-h-[500px] px-6 pb-8 pt-11 text-center sm:px-10"
      cardDesktopTop="xl:top-[190px]"
    >
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-tv-blue-50">
        <LoaderCircle
          aria-hidden="true"
          className="size-8 animate-spin text-tv-blue-500"
          strokeWidth={1.7}
        />
      </div>
      <h1 className="mt-5 text-[26px] font-bold leading-[1.4] tracking-[-0.035em] text-tv-ink">
        초대 정보를 확인하고 있어요
      </h1>
      <p className="mt-1 text-[13px] leading-[1.6] text-tv-gray" role="status">
        안전한 초대 화면을 준비하는 중입니다.
      </p>
    </AuthPageShell>
  );
}

export default function WorkspaceInvitationAcceptPage() {
  return (
    <Suspense fallback={<InvitationPageFallback />}>
      <InvitationAcceptScreen />
    </Suspense>
  );
}
