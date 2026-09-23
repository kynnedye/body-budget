import { searchFoods } from "@/lib/food-search";
import { requireUnlockedApi } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await requireUnlockedApi())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const items = await searchFoods(query);
  return Response.json({ items, usdaConfigured: Boolean(process.env.USDA_API_KEY?.trim()) });
}
