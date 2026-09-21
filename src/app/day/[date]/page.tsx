import { notFound } from "next/navigation";
import { CheckInForm } from "@/components/check-in-form";
import { getCheckinData } from "@/lib/data";
import { isValidDateKey, todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidDateKey(date)) notFound();
  const data = await getCheckinData(date);
  return <CheckInForm key={date} date={date} today={todayKey()} {...data} />;
}
