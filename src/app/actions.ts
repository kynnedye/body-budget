"use server";

import { Prisma, TrackerKind, ValueType } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { gateCookieName, gatePassword, gateToken } from "@/lib/auth";
import { requireUnlocked } from "@/lib/session";
import { dateFromKey, isValidDateKey, todayKey } from "@/lib/dates";
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
  revalidatePath("/history");
  revalidatePath("/trends");
  revalidatePath("/export");
  if (date) revalidatePath(`/day/${date}`);
}

export async function openDay(formData: FormData) {
  await requireUnlocked();
  const date = String(formData.get("date") ?? "");
  if (!isValidDateKey(date)) redirect("/history");
  if (date > todayKey()) redirect("/");
  redirect(`/day/${date}`);
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
  await requireUnlocked();
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
  await requireUnlocked();
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
  await requireUnlocked();
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

type FoodInput = {
  name: string;
  brand: string | null;
  calories: number;
  quantity: number;
  unit: string;
  kcalPer100g: number | null;
  source: string;
  sourceId: string | null;
};

export async function addFoodEntry(date: string, input: FoodInput) {
  await requireUnlocked();
  requireDate(date);
  const name = input.name.trim().slice(0, 160);
  if (!name) throw new Error("Food needs a name");
  if (!Number.isFinite(input.calories) || input.calories < 0 || input.calories > 20000) {
    throw new Error("Invalid calories");
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 20000) {
    throw new Error("Invalid quantity");
  }
  const dayLog = await getDayLog(date);
  const entry = await prisma.foodEntry.create({
    data: {
      dayLogId: dayLog.id,
      name,
      brand: input.brand?.trim().slice(0, 120) || null,
      calories: Math.round(input.calories * 10) / 10,
      quantity: input.quantity,
      unit: input.unit.trim().slice(0, 16) || "g",
      kcalPer100g: input.kcalPer100g,
      source: input.source.trim().slice(0, 32) || "custom",
      sourceId: input.sourceId?.trim().slice(0, 80) || null,
    },
  });
  refresh(date);
  return entry;
}

export async function removeFoodEntry(date: string, id: string) {
  await requireUnlocked();
  requireDate(date);
  const dayLog = await prisma.dayLog.findUnique({ where: { date: dateFromKey(date) } });
  if (!dayLog) return;
  await prisma.foodEntry.deleteMany({ where: { id, dayLogId: dayLog.id } });
  refresh(date);
}

export async function createTracker(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  await requireUnlocked();
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
  await requireUnlocked();
  await prisma.tracker.update({ where: { id }, data: { isActive } });
  revalidatePath("/trackers");
  refresh();
}

export async function unlockApp(formData: FormData) {
  const password = gatePassword();
  if (!password) redirect("/login");
  const submitted = String(formData.get("password") ?? "").trim();
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

export async function lockApp() {
  const jar = await cookies();
  jar.delete(gateCookieName());
  redirect("/login");
}
