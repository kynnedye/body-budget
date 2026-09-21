-- CreateEnum
CREATE TYPE "TrackerKind" AS ENUM ('HABIT', 'SYMPTOM');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('BOOLEAN', 'NUMBER', 'SEVERITY');

-- CreateTable
CREATE TABLE "Tracker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TrackerKind" NOT NULL,
    "valueType" "ValueType" NOT NULL,
    "unit" TEXT,
    "emoji" TEXT,
    "color" TEXT NOT NULL DEFAULT '#7c6f64',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "mood" INTEGER,
    "energy" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayValue" (
    "id" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "trackerId" TEXT NOT NULL,
    "boolValue" BOOLEAN,
    "numValue" DOUBLE PRECISION,
    "severity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tracker_kind_isActive_sortOrder_idx" ON "Tracker"("kind", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Tracker_kind_name_key" ON "Tracker"("kind", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DayLog_date_key" ON "DayLog"("date");

-- CreateIndex
CREATE INDEX "DayValue_trackerId_idx" ON "DayValue"("trackerId");

-- CreateIndex
CREATE UNIQUE INDEX "DayValue_dayLogId_trackerId_key" ON "DayValue"("dayLogId", "trackerId");

-- AddForeignKey
ALTER TABLE "DayValue" ADD CONSTRAINT "DayValue_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "DayLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayValue" ADD CONSTRAINT "DayValue_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "Tracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
