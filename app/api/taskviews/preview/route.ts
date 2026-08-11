import { proxyToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyToBackend("/v1/taskviews/preview", {
    method: "POST",
    body: await request.text(),
  });
}

