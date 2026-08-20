import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono, GeistSans } from "geist/font";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Needex — Purpose to View",
  description: "업무 목적을 안전하고 증명 가능한 데이터 View로 컴파일합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`} data-scroll-behavior="smooth" lang="ko">
      <body>
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        <Toaster closeButton position="top-right" richColors />
      </body>
    </html>
  );
}
