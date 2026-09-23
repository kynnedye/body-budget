import { getExportData } from "@/lib/export-data";
import { requireUnlockedApi } from "@/lib/session";

function cell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  if (!(await requireUnlockedApi())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await getExportData();
  const headers = ["date", "mood", "energy", "sleepHours", "calories", "note", "foods", ...data.trackers.map((tracker) => tracker.name)];
  const rows = data.days.map((day) => [
    day.date,
    day.mood,
    day.energy,
    day.sleepHours,
    day.calories ? Math.round(day.calories) : "",
    day.note,
    day.foods.map((food) => `${food.name} (${Math.round(food.calories)} kcal)`).join("; "),
    ...data.trackers.map((tracker) => day.values[tracker.id] ?? ""),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=body-budget.csv",
    },
  });
}
