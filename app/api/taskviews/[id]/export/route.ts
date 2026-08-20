import { proxyAuthenticatedDownload } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const filterField = incoming.get("filter_field");
  const filterValue = incoming.get("filter_value");
  if (filterField && filterValue) {
    query.set("filter_field", filterField);
    query.set("filter_value", filterValue);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return proxyAuthenticatedDownload(`/v1/taskviews/${encodeURIComponent(id)}/data.csv${suffix}`);
}
