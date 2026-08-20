import { LoaderCircle } from "lucide-react";

export default function NeedexDetailLoading() {
  return <div className="grid min-h-[620px] place-items-center"><div className="flex flex-col items-center gap-3 text-tv-gray" role="status"><LoaderCircle className="size-7 animate-spin text-tv-blue-600" /><p className="text-[12px]">Task View를 여는 중입니다.</p></div></div>;
}
