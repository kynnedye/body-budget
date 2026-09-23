export type FoodSearchHit = {
  id: string;
  name: string;
  brand: string | null;
  kcalPer100g: number;
  servingGrams: number | null;
  servingLabel: string | null;
  source: "usda";
};

type UsdaFood = {
  fdcId: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: Array<{ nutrientId?: number; nutrientNumber?: string; value?: number }>;
};

// Generic whole foods first; branded packaged items are noisier, so they fill in behind.
const GENERIC_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)"];
const BRANDED_TYPES = ["Branded"];

function usdaKey() {
  return process.env.USDA_API_KEY?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

function kcalPer100g(food: UsdaFood) {
  const match =
    food.foodNutrients?.find((nutrient) => nutrient.nutrientId === 1008) ??
    food.foodNutrients?.find((nutrient) => nutrient.nutrientNumber === "208");
  const value = match?.value;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

// The GET form of this endpoint intermittently 400s on dataType values
// containing parentheses, e.g. "Survey (FNDDS)". POST is stable.
async function searchUsda(query: string, dataType: string[], pageSize: number) {
  const key = usdaKey();
  if (!key) return [];
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, pageSize, dataType }),
      cache: "no-store",
    },
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as { foods?: UsdaFood[] };

  return (payload.foods ?? []).flatMap((food) => {
    const kcal = kcalPer100g(food);
    const name = food.description?.trim();
    if (kcal == null || !name) return [];
    const grams =
      food.servingSizeUnit?.toLowerCase() === "g" && food.servingSize ? food.servingSize : null;
    const hit: FoodSearchHit = {
      id: `usda:${food.fdcId}`,
      name,
      brand: food.brandOwner?.trim() || food.brandName?.trim() || null,
      kcalPer100g: kcal,
      servingGrams: grams,
      servingLabel: food.householdServingFullText?.trim() || (grams ? `${grams} g` : null),
      source: "usda",
    };
    return [hit];
  });
}

export async function searchFoods(rawQuery: string): Promise<FoodSearchHit[]> {
  const query = rawQuery.trim().slice(0, 80);
  if (query.length < 2) return [];

  const [generic, branded] = await Promise.all([
    searchUsda(query, GENERIC_TYPES, 10).catch(() => [] as FoodSearchHit[]),
    searchUsda(query, BRANDED_TYPES, 10).catch(() => [] as FoodSearchHit[]),
  ]);

  const merged: FoodSearchHit[] = [];
  const seen = new Set<string>();
  for (const hit of [...generic, ...branded]) {
    const key = `${hit.name.toLowerCase()}:${hit.brand?.toLowerCase() ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
  }
  return merged.slice(0, 12);
}

export function isFoodSearchConfigured() {
  return Boolean(usdaKey());
}

export function caloriesForGrams(kcalPer100gValue: number, grams: number) {
  return Math.round((kcalPer100gValue * grams) / 100);
}
