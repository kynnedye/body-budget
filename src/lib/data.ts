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
