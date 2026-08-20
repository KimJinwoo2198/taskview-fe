import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NeedexLogo } from "@/components/taskview/logo";
import { Button } from "@/components/ui/button";
import { primaryCtaClass, secondaryCtaClass } from "@/components/taskview/auth/shared";

const benefits = [
  {
    number: "01",
    title: "하고 싶은 일만 입력",
    body: "데이터베이스나 항목 이름을 몰라도 필요한 데이터를 찾습니다.",
    href: "#product",
  },
  {
    number: "02",
    title: "필요한 만큼만 사용",
    body: "업무 판단에 필요한 정보는 남기고 개인정보는 줄입니다.",
    href: "#security",
  },
  {
    number: "03",
    title: "담당자가 마지막 확인",
    body: "민감한 요청은 데이터 담당자가 확인하고 모든 결정은 기록됩니다.",
    href: "#flow",
  },
];

const transformations = [
  ["상세 주소", "넓은 지역으로", "지역", "safe"],
  ["생년월일", "구간으로 묶음", "연령대", "safe"],
  ["상담 원문", "주제만 사용", "문의 주제", "safe"],
  ["이름 / 전화번호", "제외", "사용 안 함", "danger"],
];

function ProductPreview() {
  return (
    <div className="h-full min-h-[438px] rounded-[24px] border border-tv-blue-200 bg-tv-canvas p-4 sm:min-h-[480px]">
      <div className="flex h-12 items-center justify-between rounded-xl bg-white px-4">
        <strong className="text-[14px] text-tv-ink">도시 민원 처리 지연 분석</strong>
        <span className="rounded-full bg-tv-green-50 px-3 py-1.5 text-[10px] font-medium text-tv-green-700">사용 가능</span>
      </div>

      <div className="mt-4 rounded-[14px] bg-tv-blue-50 p-4">
        <p className="text-[13px] font-bold leading-5 text-tv-ink">“NYC 311 민원에서 기관·유형별 운영 병목을 찾고 싶습니다.”</p>
        <p className="mt-1.5 text-[11px] text-tv-gray">운영팀 · 뉴욕시 · 7일</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-medium text-tv-blue-500">
          {['FCC Complaints', 'NYC 311', 'NHTSA Safety'].map((source) => (
            <span className="rounded-full bg-white px-3 py-1.5" key={source}>{source}</span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-tv-blue-500 px-3 py-1.5 text-white">
            <ArrowRight aria-hidden="true" className="size-3.5" /> 분석 데이터
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-tv-border bg-white px-4 py-3.5">
        <h2 className="text-[14px] font-bold text-tv-ink">필요한 정보만 안전하게 정리</h2>
        <div className="mt-2 grid gap-0.5">
          {transformations.map(([source, action, target, tone]) => (
            <div className="grid min-h-7 grid-cols-[1fr_18px_104px_1fr] items-center gap-2 text-[10px] sm:text-[11px]" key={source}>
              <span className="font-medium text-tv-ink">{source}</span>
              <ArrowRight aria-hidden="true" className="size-3.5 text-tv-slate" />
              <span className={tone === "danger" ? "rounded-full bg-tv-red-50 px-2.5 py-1 text-center font-medium text-tv-red-700" : "rounded-full bg-tv-teal-50 px-2.5 py-1 text-center font-medium text-tv-teal-700"}>
                {action}
              </span>
              <span className="font-medium text-tv-ink">{target}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex min-h-[62px] flex-wrap items-center gap-2 rounded-[14px] border border-tv-border bg-white px-4 py-3 text-[10px] font-medium">
        <span className="rounded-full bg-tv-green-50 px-3 py-1.5 text-tv-green-700">개인정보 확인됨</span>
        <span className="rounded-full bg-tv-blue-50 px-3 py-1.5 text-tv-blue-500">분석 가능</span>
        <span className="rounded-full bg-tv-blue-50 px-3 py-1.5 text-tv-blue-500">7일간 사용</span>
        <span className="ml-auto text-tv-gray">검토 기록 완료 ✓</span>
      </div>
    </div>
  );
}

export function LandingScreen() {
  return (
    <main className="min-h-screen w-full bg-white font-sans text-tv-ink xl:min-h-[1024px]">
      <header className="h-[76px] border-b border-tv-border bg-white px-5 sm:px-8 xl:px-10 xl:pr-12">
        <div className="flex h-full items-center">
          <NeedexLogo href="/" />
          <nav aria-label="랜딩 페이지" className="ml-auto hidden items-center gap-10 text-[13px] font-medium text-tv-gray md:flex">
            <a className="hover:text-tv-blue-500" href="#product">제품 소개</a>
            <a className="hover:text-tv-blue-500" href="#security">보안 원리</a>
            <a className="hover:text-tv-blue-500" href="#flow">사용 흐름</a>
          </nav>
          <div className="ml-6 flex items-center gap-3 md:ml-[98px]">
            <Button asChild className="hidden h-10 w-28 rounded-[10px] border-tv-border bg-white text-[14px] text-tv-ink hover:bg-tv-canvas sm:inline-flex" variant="outline">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild className="h-10 rounded-[10px] bg-tv-blue-500 px-4 text-[13px] text-white hover:bg-tv-blue-600 sm:w-[168px] sm:text-[14px]">
              <Link href="/signup">무료로 시작하기 <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-5 pb-20 pt-10 sm:px-8 xl:px-[clamp(2.5rem,4vw,6rem)] xl:pt-14">
        <section className="grid w-full items-start gap-10 xl:min-h-[480px] xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,1fr)] xl:gap-[26px]" id="product">
          <div className="pt-0.5">
            <span className="inline-flex h-7 items-center rounded-full bg-tv-blue-50 px-3 text-[11px] font-medium text-tv-blue-500 sm:text-[12px]">
              부서 간 안전한 데이터 협업
            </span>
            <h1 className="mt-[22px] max-w-[710px] text-[34px] font-bold leading-[1.35] tracking-[-0.045em] text-tv-ink sm:text-[36px] sm:leading-[50px]">
              원본 데이터 권한 대신,
              <br />
              업무에 맞는 데이터만 만들어주세요.
            </h1>
            <p className="mt-[18px] max-w-[690px] text-[15px] leading-[1.65] text-tv-gray sm:text-[16px]">
              하려는 일을 입력하면 Needex가 여러 국가·부서의 데이터에서 필요한 항목을 찾고,
              <br className="hidden lg:block" /> 개인정보를 제외한 분석용 데이터를 만들어드립니다.
            </p>
            <div className="mt-[18px] flex flex-wrap gap-3.5">
              <Button asChild className={`${primaryCtaClass} w-[186px]`}>
                <Link href="/signup">분석 데이터 만들어보기 <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
              <Button asChild className={`${secondaryCtaClass} w-[138px]`} variant="outline">
                <Link href="/login?next=/dashboard">데모 살펴보기</Link>
              </Button>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-tv-slate sm:text-[12px]">
              원본 개인정보 직접 접근 없이 · 사용 기간 제한 · 담당자 검토 · 모든 결정 기록
            </p>
          </div>
          <ProductPreview />
        </section>

        <section className="mt-14 w-full xl:mt-[50px]" id="security">
          <h2 className="text-[24px] font-bold leading-10 tracking-[-0.025em] text-tv-ink">왜 Needex인가요?</h2>
          <p className="text-[13px] leading-5 text-tv-gray">더 많이 공유하는 대신, 함께 일하는 데 필요한 만큼만 공유합니다.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6" id="flow">
            {benefits.map((benefit) => (
              <article className="flex min-h-[190px] flex-col rounded-[18px] border border-tv-border bg-white p-[17px]" key={benefit.number}>
                <span className="grid h-7 w-12 place-items-center rounded-full bg-tv-blue-50 text-[11px] font-medium text-tv-blue-500">{benefit.number}</span>
                <h3 className="mt-3 text-[18px] font-bold leading-7 text-tv-ink">{benefit.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-tv-gray">{benefit.body}</p>
                <a className="mt-auto inline-flex items-center gap-1 text-[12px] font-medium text-tv-blue-500 hover:text-tv-blue-700" href={benefit.href}>
                  자세히 보기 <ArrowRight aria-hidden="true" className="size-3.5" />
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
