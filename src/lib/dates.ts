const defaultTimeZone = "America/New_York";

function resolveTimeZone(candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    // Dashboard env editors often keep the quotes copied from .env.example.
    const zone = candidate?.trim().replace(/^['"]|['"]$/g, "");
    if (!zone) continue;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone });
      return zone;
    } catch {
      console.warn(`Ignoring invalid APP_TIME_ZONE value: ${candidate}`);
    }
  }
  return defaultTimeZone;
}

export const appTimeZone = resolveTimeZone([
  process.env.NEXT_PUBLIC_APP_TIME_ZONE,
  process.env.APP_TIME_ZONE,
]);

export function todayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: appTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isValidDateKey(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function dateFromKey(key: string) {
  if (!isValidDateKey(key)) {
    throw new Error(`Invalid date key: ${key}`);
  }
  return new Date(`${key}T00:00:00.000Z`);
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftDate(key: string, days: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

export function dateKeysInRange(startKey: string, endKey: string) {
  const keys: string[] = [];
  for (let key = startKey; key <= endKey; key = shiftDate(key, 1)) {
    keys.push(key);
  }
  return keys;
}

export function prettyDate(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(dateFromKey(key));
}
