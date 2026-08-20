import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <main className="grid min-h-screen place-items-center bg-tv-canvas p-6"><div className="flex flex-col items-center gap-3 text-tv-gray" role="status"><LoaderCircle className="size-7 animate-spin text-tv-blue-600" /><p className="text-[12px]">페이지를 준비하고 있습니다.</p></div></main>;
}
