import Link from "next/link";
import { TrendsChart } from "@/components/trends-chart";
import { dateFromKey, dateKey, dateKeysInRange, shiftDate, todayKey } from "@/lib/dates";
import { recordedMetric } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? 30);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const endKey = todayKey();
  const startKey = shiftDate(endKey, -(days - 1));

  const [logs, trackers] = await Promise.all([
    prisma.dayLog.findMany({
      where: { date: { gte: dateFromKey(startKey) } },
      orderBy: { date: "asc" },
      include: { values: true, foods: true },
    }),
    prisma.tracker.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const logsByDate = new Map(logs.map((log) => [dateKey(log.date), log]));
  const metrics = [
    { id: "calories", name: "Calories", color: "#9a6b47" },
    ...trackers.map((tracker) => ({
      id: tracker.id,
      name: tracker.name,
      color: tracker.color,
    })),
  ];
  const rows = dateKeysInRange(startKey, endKey).map((key) => {
    const log = logsByDate.get(key);
    const calories = log?.foods.length
      ? Math.round(log.foods.reduce((sum, food) => sum + food.calories, 0))
      : null;
    const row: Record<string, string | number | null> = {
      date: key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(dateFromKey(key)),
      mood: log?.mood ?? null,
      energy: log?.energy ?? null,
      sleep: log?.sleepHours ?? null,
      calories,
    };
    for (const tracker of trackers) {
      const value = log?.values.find((entry) => entry.trackerId === tracker.id);
      row[tracker.id] = recordedMetric(value);
    }
    return row as {
      date: string;
      label: string;
      mood: number | null;
      energy: number | null;
      sleep: number | null;
    };
  });

  const loggedDays = logs.filter((log) =>
    log.mood != null || log.energy != null || log.sleepHours != null || log.note || log.values.length > 0 || log.foods.length > 0,
  );

  const calorieDays = logs
    .map((log) => (log.foods.length ? log.foods.reduce((sum, food) => sum + food.calories, 0) : null));

  const avg = (values: Array<number | null>) => {
    const present = values.filter((value): value is number => value !== null);
    return present.length ? (present.reduce((sum, value) => sum + value, 0) / present.length).toFixed(1) : "—";
  };

  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Look back without judgment</span>
        <h1>Patterns, not verdicts.</h1>
        <p className="lede">These charts can surface questions worth asking. They cannot prove what caused a symptom. Empty days stay on the axis as gaps.</p>
      </header>

      <div className="stats-grid">
        <div className="card stat"><strong>{loggedDays.length}</strong><span>days logged in this range</span></div>
        <div className="card stat"><strong>{avg(logs.map((log) => log.mood))}</strong><span>average mood</span></div>
        <div className="card stat"><strong>{avg(logs.map((log) => log.sleepHours))}</strong><span>average sleep hours</span></div>
        <div className="card stat"><strong>{avg(calorieDays)}</strong><span>average calories</span></div>
      </div>

      <section className="card section-card">
        <div className="section-heading">
          <span />
          <div className="range-links">
            {[7, 30, 90].map((range) => (
              <Link className={range === days ? "active" : ""} href={`/trends?days=${range}`} key={range}>{range} days</Link>
            ))}
          </div>
        </div>
        <TrendsChart rows={rows} metrics={metrics} hasLogs={loggedDays.length > 0} />
      </section>

      <p className="fine-print" style={{ marginTop: 18 }}>
        A visual overlap is not proof of causation. Medication, substance use, sleep, and health symptoms are best discussed with a qualified clinician.
      </p>
    </>
  );
}
