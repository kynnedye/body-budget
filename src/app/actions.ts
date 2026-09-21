"use server";

import { Prisma, TrackerKind, ValueType } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { gateCookieName, gatePassword, gateToken } from "@/lib/auth";
import { dateFromKey, isValidDateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

async function getDayLog(date: string) {
  return prisma.dayLog.upsert({
    where: { date: dateFromKey(date) },
    update: {},
    create: { date: dateFromKey(date) },
  });
}

function refresh(date?: string) {
  revalidatePath("/");
  revalidatePath("/trends");
  revalidatePath("/export");
  if (date) revalidatePath(`/day/${date}`);
}

function requireDate(date: string) {
  if (!isValidDateKey(date)) {
    throw new Error("Invalid date");
  }
}

export async function saveBaseline(
  date: string,
  field: "mood" | "energy" | "sleepHours",
  value: number | null,
) {
  requireDate(date);
  let next = value;
  if (next != null) {
    if (!Number.isFinite(next)) return;
    if (field === "sleepHours") next = Math.min(12, Math.max(0, next));
    else next = Math.min(5, Math.max(1, Math.round(next)));
  }
  await prisma.dayLog.upsert({
    where: { date: dateFromKey(date) },
    update: { [field]: next },
    create: { date: dateFromKey(date), [field]: next },
  });
  refresh(date);
}

export async function saveNote(date: string, note: string) {
  requireDate(date);
  await prisma.dayLog.upsert({
    where: { date: dateFromKey(date) },
    update: { note },
    create: { date: dateFromKey(date), note },
  });
  refresh(date);
}

export async function saveTrackerValue(
  date: string,
  trackerId: string,
  field: "boolValue" | "numValue" | "severity",
  value: boolean | number | null,
) {
  requireDate(date);
  const tracker = await prisma.tracker.findUnique({ where: { id: trackerId } });
  if (!tracker) return;

  const next = value;
  if (field === "severity" && typeof next === "number") {
    if (!Number.isInteger(next) || next < 0 || next > 3) return;
  }
  if (field === "numValue" && typeof next === "number") {
    if (!Number.isFinite(next) || next < 0) return;
  }

  const dayLog = await getDayLog(date);
  await prisma.dayValue.upsert({
    where: { dayLogId_trackerId: { dayLogId: dayLog.id, trackerId } },
    update: { [field]: next },
    create: { dayLogId: dayLog.id, trackerId, [field]: next },
  });
  refresh(date);
}

export async function createTracker(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const kind = formData.get("kind") === "SYMPTOM"
    ? TrackerKind.SYMPTOM
    : TrackerKind.HABIT;
  const requestedType = String(formData.get("valueType"));
  const valueType = kind === TrackerKind.SYMPTOM
    ? ValueType.SEVERITY
    : requestedType === "NUMBER"
      ? ValueType.NUMBER
      : ValueType.BOOLEAN;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give this tracker a name." };

  const max = await prisma.tracker.aggregate({
    where: { kind },
    _max: { sortOrder: true },
  });

  try {
    await prisma.tracker.create({
      data: {
        name,
        kind,
        valueType,
        unit: valueType === ValueType.NUMBER
          ? String(formData.get("unit") ?? "").trim() || null
          : null,
        emoji: String(formData.get("emoji") ?? "").trim() || null,
        color: String(formData.get("color") ?? "#7c6f64"),
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "You already have a tracker with that name." };
    }
    throw error;
  }
  revalidatePath("/trackers");
  refresh();
  return { error: undefined };
}

export async function toggleTracker(id: string, isActive: boolean) {
  await prisma.tracker.update({ where: { id }, data: { isActive } });
  revalidatePath("/trackers");
  refresh();
}

export async function unlockApp(formData: FormData) {
  const password = gatePassword();
  if (!password) redirect("/");
  const submitted = String(formData.get("password") ?? "");
  if (submitted !== password) {
    redirect("/login?error=1");
  }
  const jar = await cookies();
  jar.set(gateCookieName(), await gateToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}
