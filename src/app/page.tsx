import { CheckInForm } from "@/components/check-in-form";
import { getCheckinData } from "@/lib/data";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const date = todayKey();
  const data = await getCheckinData(date);
  return <CheckInForm key={date} date={date} today={date} {...data} />;
}
