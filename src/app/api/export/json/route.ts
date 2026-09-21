import { getExportData } from "@/lib/export-data";

export async function GET() {
  const data = await getExportData();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=body-budget.json",
    },
  });
}
