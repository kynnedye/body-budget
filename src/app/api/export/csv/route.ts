import { getExportData } from "@/lib/export-data";

function cell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  const data = await getExportData();
  const headers = ["date", "mood", "energy", "sleepHours", "note", ...data.trackers.map((tracker) => tracker.name)];
  const rows = data.days.map((day) => [
    day.date,
    day.mood,
    day.energy,
    day.sleepHours,
    day.note,
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
