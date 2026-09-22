import { getExportData } from "@/lib/export-data";
import { requireUnlockedApi } from "@/lib/session";

export async function GET() {
  if (!(await requireUnlockedApi())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await getExportData();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=body-budget.json",
    },
  });
}
