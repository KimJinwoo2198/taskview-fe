import { proxyToBackend } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  return proxyToBackend("/health");
}

