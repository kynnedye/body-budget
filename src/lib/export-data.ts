import { dateKey } from "@/lib/dates";
import { recordedMetric } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

export async function getExportData() {
  const [trackers, logs] = await Promise.all([
    prisma.tracker.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] }),
    prisma.dayLog.findMany({
      orderBy: { date: "asc" },
      include: { values: true, foods: true },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    trackers,
    days: logs.map((log) => ({
      date: dateKey(log.date),
      mood: log.mood,
      energy: log.energy,
      sleepHours: log.sleepHours,
      note: log.note,
      calories: log.foods.reduce((sum, food) => sum + food.calories, 0),
      foods: log.foods.map((food) => ({
        name: food.name,
        brand: food.brand,
        calories: food.calories,
        quantity: food.quantity,
        unit: food.unit,
      })),
      values: Object.fromEntries(
        log.values.map((value) => [value.trackerId, recordedMetric(value)]),
      ),
    })),
  };
}
