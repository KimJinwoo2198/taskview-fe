import Link from "next/link";

import { cn } from "@/lib/utils";

interface NeedexLogoProps {
  className?: string;
  href?: string;
  inverse?: boolean;
}

export function NeedexLogo({ className, href = "/dashboard", inverse = false }: NeedexLogoProps) {
  const content = (
    <>
      <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-tv-blue-500 text-[19px] font-bold leading-none text-white">
        T
      </span>
      <span className="grid gap-0.5">
        <span className={cn("text-[17px] font-bold leading-none tracking-[-0.02em]", inverse ? "text-white" : "text-tv-ink")}>
          Needex
        </span>
        <span className={cn("text-[10px] font-normal leading-none", inverse ? "text-blue-100" : "text-tv-slate")}>
          Purpose-to-Data
        </span>
      </span>
    </>
  );

  if (!href) return <span className={cn("inline-flex items-center gap-[11px]", className)}>{content}</span>;

  return (
    <Link aria-label="Needex 홈" className={cn("inline-flex items-center gap-[11px]", className)} href={href}>
      {content}
    </Link>
  );
}
