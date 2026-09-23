export type FoodSearchHit = {
  id: string;
  name: string;
  brand: string | null;
  kcalPer100g: number;
  servingGrams: number | null;
  servingLabel: string | null;
  source: "usda" | "openfoodfacts";
};

function kcalFromNutrient(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function usdaKcalPer100g(food: {
  foodNutrients?: Array<{ nutrientId?: number; nutrientNumber?: string; unitName?: string; value?: number }>;
}) {
  const match =
    food.foodNutrients?.find((nutrient) => nutrient.nutrientId === 1008) ??
    food.foodNutrients?.find((nutrient) => nutrient.nutrientNumber === "208");
  return kcalFromNutrient(match?.value);
}

async function searchUsda(query: string): Promise<FoodSearchHit[]> {
  const key = process.env.USDA_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
  if (!key) return [];
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "8");
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");
  url.searchParams.set("api_key", key);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    foods?: Array<{
      fdcId: number;
      description?: string;
      brandOwner?: string;
      servingSize?: number;
      servingSizeUnit?: string;
      householdServingFullText?: string;
      foodNutrients?: Array<{ nutrientId?: number; nutrientNumber?: string; unitName?: string; value?: number }>;
    }>;
  };
  return (payload.foods ?? []).flatMap((food) => {
    const kcalPer100g = usdaKcalPer100g(food);
    if (kcalPer100g == null) return [];
    const grams =
      food.servingSizeUnit?.toLowerCase() === "g" && food.servingSize
        ? food.servingSize
        : null;
    const hit: FoodSearchHit = {
      id: `usda:${food.fdcId}`,
      name: food.description?.trim() || "USDA food",
      brand: food.brandOwner?.trim() || null,
      kcalPer100g,
      servingGrams: grams,
      servingLabel: food.householdServingFullText?.trim() || (grams ? `${grams} g` : null),
      source: "usda",
    };
    return [hit];
  });
}

async function searchOpenFoodFacts(query: string): Promise<FoodSearchHit[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "8");
  const response = await fetch(url, {
    headers: { "User-Agent": "BodyBudget/0.1 (personal wellbeing tracker)" },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    products?: Array<{
      code?: string;
      product_name?: string;
      generic_name?: string;
      brands?: string;
      serving_quantity?: number | string;
      serving_size?: string;
      nutriments?: Record<string, number | string | undefined>;
    }>;
  };
  return (payload.products ?? []).flatMap((product) => {
    const kcalPer100g = kcalFromNutrient(product.nutriments?.["energy-kcal_100g"]);
    if (kcalPer100g == null) return [];
    const name = product.product_name?.trim() || product.generic_name?.trim();
    if (!name) return [];
    const servingGrams = kcalFromNutrient(product.serving_quantity);
    const hit: FoodSearchHit = {
      id: `off:${product.code || name}`,
      name,
      brand: product.brands?.split(",")[0]?.trim() || null,
      kcalPer100g,
      servingGrams,
      servingLabel: product.serving_size?.trim() || null,
      source: "openfoodfacts",
    };
    return [hit];
  });
}

export async function searchFoods(rawQuery: string): Promise<FoodSearchHit[]> {
  const query = rawQuery.trim().slice(0, 80);
  if (query.length < 2) return [];

  const [usda, packaged] = await Promise.all([
    searchUsda(query).catch(() => [] as FoodSearchHit[]),
    searchOpenFoodFacts(query).catch(() => [] as FoodSearchHit[]),
  ]);

  const merged: FoodSearchHit[] = [];
  const seen = new Set<string>();
  for (const hit of [...usda, ...packaged]) {
    const key = `${hit.source}:${hit.name.toLowerCase()}:${hit.brand ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
  }
  return merged.slice(0, 12);
}

export function caloriesForGrams(kcalPer100g: number, grams: number) {
  return Math.round((kcalPer100g * grams) / 100);
}
