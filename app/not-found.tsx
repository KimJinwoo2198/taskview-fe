import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-tv-canvas p-6">
      <div className="w-full max-w-md rounded-[18px] border border-tv-border bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-tv-blue-50 text-tv-blue-600"><FileQuestion className="size-7" /></span>
        <p className="mt-5 text-[10px] font-bold tracking-[0.14em] text-tv-blue-600">404 · NOT FOUND</p>
        <h1 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-tv-ink">요청한 페이지를 찾을 수 없습니다.</h1>
        <p className="mt-3 text-[12px] leading-5 text-tv-gray">주소가 바뀌었거나 접근할 수 없는 Task View일 수 있습니다.</p>
        <Button asChild className="mt-6 h-10 rounded-[10px] px-5"><Link href="/dashboard">대시보드로 이동</Link></Button>
      </div>
    </main>
  );
}
