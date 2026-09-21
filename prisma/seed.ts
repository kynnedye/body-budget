import { PrismaClient, TrackerKind, ValueType } from "@prisma/client";

const prisma = new PrismaClient();

const trackers = [
  { name: "Exercise", emoji: "🏃", kind: TrackerKind.HABIT, valueType: ValueType.NUMBER, unit: "minutes", color: "#47866b" },
  { name: "Caffeine", emoji: "☕", kind: TrackerKind.HABIT, valueType: ValueType.NUMBER, unit: "drinks", color: "#9a6b47" },
  { name: "Alcohol", emoji: "🍷", kind: TrackerKind.HABIT, valueType: ValueType.NUMBER, unit: "drinks", color: "#9c5967" },
  { name: "Cannabis", emoji: "🌿", kind: TrackerKind.HABIT, valueType: ValueType.BOOLEAN, unit: null, color: "#6e8b60" },
  { name: "Supplements", emoji: "💊", kind: TrackerKind.HABIT, valueType: ValueType.BOOLEAN, unit: null, color: "#7373a8" },
  { name: "Anxiety", emoji: "〰️", kind: TrackerKind.SYMPTOM, valueType: ValueType.SEVERITY, unit: null, color: "#c56b5d" },
  { name: "Tiredness", emoji: "😴", kind: TrackerKind.SYMPTOM, valueType: ValueType.SEVERITY, unit: null, color: "#6d78a8" },
  { name: "Body pain", emoji: "🩹", kind: TrackerKind.SYMPTOM, valueType: ValueType.SEVERITY, unit: null, color: "#ad685f" },
  { name: "Brain fog", emoji: "🌫️", kind: TrackerKind.SYMPTOM, valueType: ValueType.SEVERITY, unit: null, color: "#7d7d82" },
];

async function main() {
  for (const [sortOrder, tracker] of trackers.entries()) {
    await prisma.tracker.upsert({
      where: { kind_name: { kind: tracker.kind, name: tracker.name } },
      update: {},
      create: { ...tracker, sortOrder },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
