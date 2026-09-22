import { prisma } from "@/lib/prisma";
import { dateFromKey } from "@/lib/dates";

export async function getCheckinData(date: string) {
  const [trackers, dayLog] = await Promise.all([
    prisma.tracker.findMany({
      where: { isActive: true },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.dayLog.findUnique({
      where: { date: dateFromKey(date) },
      include: { values: true },
    }),
  ]);
  return { trackers, dayLog };
}

export async function getHistoryDays() {
  return prisma.dayLog.findMany({
    where: {
      OR: [
        { mood: { not: null } },
        { energy: { not: null } },
        { sleepHours: { not: null } },
        { note: { not: "" } },
        { values: { some: {} } },
      ],
    },
    orderBy: { date: "desc" },
    include: { values: true },
  });
}
