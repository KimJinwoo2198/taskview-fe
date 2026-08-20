import { JP, KR, US, VN } from "country-flag-icons/react/3x2";

import { cn } from "@/lib/utils";

type FlagComponent = typeof US;

const flags: Record<string, { component: FlagComponent; label: string }> = {
  "🇺🇸": { component: US, label: "미국" },
  US: { component: US, label: "미국" },
  "🇰🇷": { component: KR, label: "대한민국" },
  KR: { component: KR, label: "대한민국" },
  "🇯🇵": { component: JP, label: "일본" },
  JP: { component: JP, label: "일본" },
  "🇻🇳": { component: VN, label: "베트남" },
  VN: { component: VN, label: "베트남" },
};

const sizes = {
  sm: "size-6",
  md: "size-9",
  lg: "size-12",
};

export function CountryFlag({ code, size = "sm", className }: { code: string; size?: keyof typeof sizes; className?: string }) {
  const flag = flags[code] ?? flags.US;
  const Flag = flag.component;

  return (
    <span
      aria-label={flag.label}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full border border-white/90 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.16)] ring-1 ring-tv-border",
        sizes[size],
        className,
      )}
      role="img"
    >
      <Flag className="h-full w-full scale-[1.45] object-cover" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-black/10" />
    </span>
  );
}
