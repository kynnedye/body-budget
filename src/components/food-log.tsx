"use client";

import type { FavoriteFood, FoodEntry } from "@prisma/client";
import { Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { addFoodEntry, removeFavorite, removeFoodEntry, saveFavorite } from "@/app/actions";
import { favoriteIdentity } from "@/lib/favorites";
import type { FoodSearchHit } from "@/lib/food-search";

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

function caloriesForGrams(kcalPer100g: number, grams: number) {
  return Math.round((kcalPer100g * grams) / 100);
}

function defaultGrams(hit: FoodSearchHit) {
  return hit.servingGrams && hit.servingGrams > 0 ? Math.round(hit.servingGrams) : 100;
}

function hitInput(hit: FoodSearchHit, grams: number): FoodInput {
  return {
    name: hit.name,
    brand: hit.brand,
    calories: caloriesForGrams(hit.kcalPer100g, grams),
    quantity: grams,
    unit: "g",
    kcalPer100g: hit.kcalPer100g,
    source: hit.source,
    sourceId: hit.id,
  };
}

function entryInput(item: FoodEntry): FoodInput {
  return {
    name: item.name,
    brand: item.brand,
    calories: item.calories,
    quantity: item.quantity,
    unit: item.unit,
    kcalPer100g: item.kcalPer100g,
    source: item.source,
    sourceId: item.sourceId,
  };
}

function samePortion(favorite: FavoriteFood, input: FoodInput) {
  return (
    favorite.unit === input.unit &&
    Math.round(favorite.quantity) === Math.round(input.quantity) &&
    Math.round(favorite.calories) === Math.round(input.calories)
  );
}

function favoriteDetail(favorite: FavoriteFood) {
  const amount = favorite.unit === "g" ? `${Math.round(favorite.quantity)} g` : null;
  return [favorite.brand, amount, `${Math.round(favorite.calories)} kcal`].filter(Boolean).join(" · ");
}

function StarButton({
  active,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`icon-button${active ? " starred" : ""}`}
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <Star size={16} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

export function FoodLog({
  date,
  foods,
  favorites,
  persist,
}: {
  date: string;
  foods: FoodEntry[];
  favorites: FavoriteFood[];
  persist: (work: () => Promise<void>) => void;
}) {
  const [items, setItems] = useState(foods);
  const [saved, setSaved] = useState(favorites);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<FoodSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [picked, setPicked] = useState<FoodSearchHit | null>(null);
  const [grams, setGrams] = useState(100);
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [, startTransition] = useTransition();
  const activeQuery = query.trim();
  const showResults = activeQuery.length >= 2 && !picked;

  useEffect(() => {
    if (activeQuery.length < 2) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/foods/search?q=${encodeURIComponent(activeQuery)}`);
        if (!response.ok) {
          setHits([]);
          return;
        }
        const payload = (await response.json()) as {
          items: FoodSearchHit[];
          configured?: boolean;
        };
        setHits(payload.items);
        setConfigured(Boolean(payload.configured));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [activeQuery]);

  const total = Math.round(items.reduce((sum, item) => sum + item.calories, 0));
  const pendingCalories = picked ? caloriesForGrams(picked.kcalPer100g, grams) : 0;
  const customCaloriesNumber = Number(customCalories);
  const customInput: FoodInput | null =
    customName.trim() && Number.isFinite(customCaloriesNumber) && customCaloriesNumber >= 0
      ? {
          name: customName.trim(),
          brand: null,
          calories: customCaloriesNumber,
          quantity: 1,
          unit: "item",
          kcalPer100g: null,
          source: "custom",
          sourceId: null,
        }
      : null;

  function matchingFavorite(input: FoodInput) {
    const identity = favoriteIdentity(input);
    return saved.find((item) => item.identity === identity) ?? null;
  }

  function starLabel(input: FoodInput, mode: "toggle" | "update") {
    const existing = matchingFavorite(input);
    if (!existing) return `Save ${input.name} to favorites`;
    if (mode === "update" && !samePortion(existing, input)) {
      const amount = input.unit === "g" ? `${Math.round(input.quantity)} g` : `${Math.round(input.calories)} kcal`;
      return `Update ${input.name} favorite to ${amount}`;
    }
    return `Remove ${input.name} from favorites`;
  }

  function starFood(input: FoodInput, mode: "toggle" | "update") {
    const identity = favoriteIdentity(input);
    const existing = matchingFavorite(input);
    const replaceAmount = mode === "update" && existing != null && !samePortion(existing, input);
    if (existing && !replaceAmount) {
      setSaved((current) => current.filter((item) => item.identity !== identity));
      persist(async () => {
        await removeFavorite(identity);
      });
      return;
    }
    persist(async () => {
      const favorite = await saveFavorite(input);
      setSaved((current) => [favorite, ...current.filter((item) => item.identity !== favorite.identity)]);
    });
  }

  function addInput(input: FoodInput, after?: () => void) {
    persist(async () => {
      const entry = await addFoodEntry(date, input);
      setItems((current) => [...current, entry]);
    });
    after?.();
  }

  function addPicked() {
    if (!picked || !Number.isFinite(grams) || grams <= 0) return;
    addInput(hitInput(picked, grams), () => {
      setPicked(null);
      setQuery("");
      setHits([]);
    });
  }

  function addCustom() {
    if (!customInput) return;
    addInput(customInput, () => {
      setCustomName("");
      setCustomCalories("");
    });
  }

  function addSaved(favorite: FavoriteFood) {
    addInput({
      name: favorite.name,
      brand: favorite.brand,
      calories: favorite.calories,
      quantity: favorite.quantity,
      unit: favorite.unit,
      kcalPer100g: favorite.kcalPer100g,
      source: favorite.source,
      sourceId: favorite.sourceId,
    });
  }

  const pickedInput = picked && Number.isFinite(grams) && grams > 0 ? hitInput(picked, grams) : null;

  return (
    <section className="card section-card">
      <div className="section-heading">
        <div>
          <h2>Food</h2>
          <p>Search a food or tap a favorite. Star anything you want to add again later.</p>
        </div>
        <strong className="food-total">{total} kcal</strong>
      </div>

      {saved.length > 0 ? (
        <div className="food-favorites">
          <p className="fine-print">Favorites</p>
          {saved.map((favorite) => (
            <div className="food-hit" key={favorite.id}>
              <button className="food-hit-main" type="button" onClick={() => addSaved(favorite)}>
                <span>
                  <strong>{favorite.name}</strong>
                  <small>{favoriteDetail(favorite)}</small>
                </span>
              </button>
              <StarButton
                active
                label={`Remove ${favorite.name} from favorites`}
                onClick={() => starFood({
                  name: favorite.name,
                  brand: favorite.brand,
                  calories: favorite.calories,
                  quantity: favorite.quantity,
                  unit: favorite.unit,
                  kcalPer100g: favorite.kcalPer100g,
                  source: favorite.source,
                  sourceId: favorite.sourceId,
                }, "toggle")}
              />
            </div>
          ))}
        </div>
      ) : null}

      <label className="food-search" style={{ marginTop: 14 }}>
        <Search size={16} aria-hidden="true" />
        <input
          className="field"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPicked(null);
          }}
          placeholder="Search banana, oatmeal, Trader Joe’s granola…"
          aria-label="Search foods"
        />
      </label>

      {picked ? (
        <div className="food-pending">
          <div>
            <h3>{picked.name}</h3>
            <p>
              {picked.brand ? `${picked.brand} · ` : ""}
              {picked.kcalPer100g} kcal / 100g
              {picked.servingLabel ? ` · ${picked.servingLabel}` : ""}
            </p>
          </div>
          <label>
            Grams
            <input
              className="field"
              type="number"
              min="1"
              step="1"
              value={grams}
              onChange={(event) => setGrams(Number(event.target.value))}
            />
          </label>
          <div className="food-pending-actions">
            <span>{pendingCalories} kcal</span>
            <StarButton
              active={Boolean(pickedInput && matchingFavorite(pickedInput))}
              label={pickedInput ? starLabel(pickedInput, "update") : `Save ${picked.name} to favorites`}
              disabled={!pickedInput}
              onClick={() => {
                if (pickedInput) starFood(pickedInput, "update");
              }}
            />
            <button className="button primary" type="button" onClick={addPicked}>
              <Plus size={16} /> Add
            </button>
            <button className="button" type="button" onClick={() => setPicked(null)}>Cancel</button>
          </div>
        </div>
      ) : null}

      {!picked && showResults ? (
        <div className="food-hits">
          {searching ? <p className="fine-print">Searching…</p> : null}
          {!searching && hits.length === 0 ? (
            <p className="fine-print">No matches. Add it by name and calories below.</p>
          ) : null}
          {hits.map((hit) => {
            const input = hitInput(hit, defaultGrams(hit));
            return (
              <div className="food-hit" key={hit.id}>
                <button
                  className="food-hit-main"
                  type="button"
                  onClick={() => {
                    setPicked(hit);
                    setGrams(defaultGrams(hit));
                  }}
                >
                  <span>
                    <strong>{hit.name}</strong>
                    <small>
                      {hit.brand ? `${hit.brand} · ` : ""}
                      {hit.kcalPer100g} kcal / 100g
                      {hit.servingLabel ? ` · ${hit.servingLabel}` : ""}
                    </small>
                  </span>
                </button>
                <StarButton
                  active={Boolean(matchingFavorite(input))}
                  label={starLabel(input, "toggle")}
                  onClick={() => starFood(input, "toggle")}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="food-list">
          {items.map((item) => {
            const input = entryInput(item);
            return (
              <div className="food-row" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.brand ? `${item.brand} · ` : ""}
                    {item.unit === "g"
                      ? `${item.quantity} g`
                      : item.quantity === 1
                        ? "custom"
                        : `${item.quantity} ${item.unit}`}
                  </p>
                </div>
                <div className="food-row-actions">
                  <strong>{Math.round(item.calories)} kcal</strong>
                  <StarButton
                    active={Boolean(matchingFavorite(input))}
                    label={starLabel(input, "update")}
                    onClick={() => starFood(input, "update")}
                  />
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      startTransition(() => {
                        persist(async () => {
                          await removeFoodEntry(date, item.id);
                          setItems((current) => current.filter((entry) => entry.id !== item.id));
                        });
                      });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty" style={{ padding: "18px 0" }}>Nothing logged to eat yet.</p>
      )}

      <div className="food-custom">
        <p>Or add something the search doesn’t know:</p>
        <div className="food-custom-row">
          <input
            className="field"
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="Homemade soup"
            aria-label="Custom food name"
          />
          <input
            className="field"
            type="number"
            min="0"
            step="1"
            value={customCalories}
            onChange={(event) => setCustomCalories(event.target.value)}
            placeholder="kcal"
            aria-label="Custom calories"
          />
          <div className="food-custom-actions">
            <StarButton
              active={Boolean(customInput && matchingFavorite(customInput))}
              label={customInput ? starLabel(customInput, "update") : "Save custom food to favorites"}
              disabled={!customInput}
              onClick={() => {
                if (customInput) starFood(customInput, "update");
              }}
            />
            <button className="button" type="button" onClick={addCustom}>Add</button>
          </div>
        </div>
      </div>

      <p className="fine-print" style={{ marginTop: 16 }}>
        {configured
          ? "Calories come from USDA FoodData Central. They are estimates."
          : "Food search needs USDA_API_KEY. Until it is set, add foods by name and calories."}
      </p>
    </section>
  );
}
