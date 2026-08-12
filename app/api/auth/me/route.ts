import { getBrowserSessionUser } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  return getBrowserSessionUser();
}
