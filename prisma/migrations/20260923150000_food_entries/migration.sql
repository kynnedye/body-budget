-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "calories" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "kcalPer100g" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodEntry_dayLogId_idx" ON "FoodEntry"("dayLogId");

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "DayLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
