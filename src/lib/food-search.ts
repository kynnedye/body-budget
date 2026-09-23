export type FoodSearchHit = {
  id: string;
  name: string;
  brand: string | null;
  kcalPer100g: number;
  servingGrams: number | null;
  servingLabel: string | null;
  source: "common" | "usda" | "openfoodfacts";
};

const COMMON_FOODS: Array<
  Omit<FoodSearchHit, "id" | "source"> & { id: string }
> = [
  { id: "banana", name: "Banana, raw", brand: null, kcalPer100g: 89, servingGrams: 118, servingLabel: "1 medium" },
  { id: "apple", name: "Apple, raw", brand: null, kcalPer100g: 52, servingGrams: 182, servingLabel: "1 medium" },
  { id: "orange", name: "Orange, raw", brand: null, kcalPer100g: 47, servingGrams: 131, servingLabel: "1 fruit" },
  { id: "strawberry", name: "Strawberries, raw", brand: null, kcalPer100g: 32, servingGrams: 152, servingLabel: "1 cup" },
  { id: "blueberry", name: "Blueberries, raw", brand: null, kcalPer100g: 57, servingGrams: 148, servingLabel: "1 cup" },
  { id: "avocado", name: "Avocado, raw", brand: null, kcalPer100g: 160, servingGrams: 68, servingLabel: "½ fruit" },
  { id: "egg", name: "Egg, whole, cooked", brand: null, kcalPer100g: 155, servingGrams: 50, servingLabel: "1 large" },
  { id: "chicken-breast", name: "Chicken breast, cooked", brand: null, kcalPer100g: 165, servingGrams: 85, servingLabel: "3 oz" },
  { id: "salmon", name: "Salmon, cooked", brand: null, kcalPer100g: 206, servingGrams: 85, servingLabel: "3 oz" },
  { id: "ground-beef", name: "Ground beef, cooked, 85% lean", brand: null, kcalPer100g: 250, servingGrams: 85, servingLabel: "3 oz" },
  { id: "tofu", name: "Tofu, firm", brand: null, kcalPer100g: 144, servingGrams: 85, servingLabel: "3 oz" },
  { id: "oatmeal", name: "Oatmeal, cooked", brand: null, kcalPer100g: 68, servingGrams: 234, servingLabel: "1 cup" },
  { id: "white-rice", name: "White rice, cooked", brand: null, kcalPer100g: 130, servingGrams: 158, servingLabel: "1 cup" },
  { id: "brown-rice", name: "Brown rice, cooked", brand: null, kcalPer100g: 123, servingGrams: 195, servingLabel: "1 cup" },
  { id: "pasta", name: "Pasta, cooked", brand: null, kcalPer100g: 131, servingGrams: 140, servingLabel: "1 cup" },
  { id: "bread", name: "Whole wheat bread", brand: null, kcalPer100g: 247, servingGrams: 32, servingLabel: "1 slice" },
  { id: "bagel", name: "Bagel", brand: null, kcalPer100g: 257, servingGrams: 98, servingLabel: "1 bagel" },
  { id: "yogurt", name: "Greek yogurt, plain", brand: null, kcalPer100g: 59, servingGrams: 170, servingLabel: "¾ cup" },
  { id: "milk", name: "Milk, 2%", brand: null, kcalPer100g: 50, servingGrams: 244, servingLabel: "1 cup" },
  { id: "cheddar", name: "Cheddar cheese", brand: null, kcalPer100g: 403, servingGrams: 28, servingLabel: "1 oz" },
  { id: "butter", name: "Butter", brand: null, kcalPer100g: 717, servingGrams: 14, servingLabel: "1 tbsp" },
  { id: "olive-oil", name: "Olive oil", brand: null, kcalPer100g: 884, servingGrams: 14, servingLabel: "1 tbsp" },
  { id: "peanut-butter", name: "Peanut butter", brand: null, kcalPer100g: 588, servingGrams: 32, servingLabel: "2 tbsp" },
  { id: "almonds", name: "Almonds", brand: null, kcalPer100g: 579, servingGrams: 28, servingLabel: "1 oz" },
  { id: "black-beans", name: "Black beans, cooked", brand: null, kcalPer100g: 132, servingGrams: 172, servingLabel: "1 cup" },
  { id: "broccoli", name: "Broccoli, cooked", brand: null, kcalPer100g: 35, servingGrams: 156, servingLabel: "1 cup" },
  { id: "spinach", name: "Spinach, raw", brand: null, kcalPer100g: 23, servingGrams: 30, servingLabel: "1 cup" },
  { id: "potato", name: "Potato, baked", brand: null, kcalPer100g: 93, servingGrams: 173, servingLabel: "1 medium" },
  { id: "sweet-potato", name: "Sweet potato, baked", brand: null, kcalPer100g: 90, servingGrams: 114, servingLabel: "1 medium" },
  { id: "coffee", name: "Coffee, black", brand: null, kcalPer100g: 1, servingGrams: 240, servingLabel: "1 cup" },
  { id: "latte", name: "Latte, with 2% milk", brand: null, kcalPer100g: 43, servingGrams: 240, servingLabel: "8 oz" },
  { id: "beer", name: "Beer, regular", brand: null, kcalPer100g: 43, servingGrams: 356, servingLabel: "12 oz" },
  { id: "wine", name: "Wine, red", brand: null, kcalPer100g: 85, servingGrams: 147, servingLabel: "5 oz" },
  { id: "dark-chocolate", name: "Dark chocolate", brand: null, kcalPer100g: 546, servingGrams: 28, servingLabel: "1 oz" },
  { id: "ice-cream", name: "Ice cream, vanilla", brand: null, kcalPer100g: 207, servingGrams: 66, servingLabel: "½ cup" },
  { id: "pizza", name: "Pizza, cheese", brand: null, kcalPer100g: 266, servingGrams: 107, servingLabel: "1 slice" },
];

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

function searchCommon(query: string): FoodSearchHit[] {
  const needle = query.toLowerCase();
  return COMMON_FOODS.filter((food) => food.name.toLowerCase().includes(needle)).map((food) => ({
    ...food,
    id: `common:${food.id}`,
    source: "common",
  }));
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
  for (const hit of [...searchCommon(query), ...usda, ...packaged]) {
    const key = `${hit.source}:${hit.name.toLowerCase()}:${hit.brand ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= 12) break;
  }
  return merged;
}

export function caloriesForGrams(kcalPer100g: number, grams: number) {
  return Math.round((kcalPer100g * grams) / 100);
}
