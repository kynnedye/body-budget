"use client";

import type { FoodEntry } from "@prisma/client";
import { Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { addFoodEntry, removeFoodEntry } from "@/app/actions";
import type { FoodSearchHit } from "@/lib/food-search";

function caloriesForGrams(kcalPer100g: number, grams: number) {
  return Math.round((kcalPer100g * grams) / 100);
}

export function FoodLog({
  date,
  foods,
  persist,
}: {
  date: string;
  foods: FoodEntry[];
  persist: (work: () => Promise<void>) => void;
}) {
  const [items, setItems] = useState(foods);
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

  function addPicked() {
    if (!picked || !Number.isFinite(grams) || grams <= 0) return;
    const calories = caloriesForGrams(picked.kcalPer100g, grams);
    persist(async () => {
      const entry = await addFoodEntry(date, {
        name: picked.name,
        brand: picked.brand,
        calories,
        quantity: grams,
        unit: "g",
        kcalPer100g: picked.kcalPer100g,
        source: picked.source,
        sourceId: picked.id,
      });
      setItems((current) => [...current, entry]);
    });
    setPicked(null);
    setQuery("");
    setHits([]);
  }

  function addCustom() {
    const name = customName.trim();
    const calories = Number(customCalories);
    if (!name || !Number.isFinite(calories) || calories < 0) return;
    persist(async () => {
      const entry = await addFoodEntry(date, {
        name,
        brand: null,
        calories,
        quantity: 1,
        unit: "item",
        kcalPer100g: null,
        source: "custom",
        sourceId: null,
      });
      setItems((current) => [...current, entry]);
    });
    setCustomName("");
    setCustomCalories("");
  }

  return (
    <section className="card section-card">
      <div className="section-heading">
        <div>
          <h2>Food</h2>
          <p>Search a food, set the amount, and keep a rough calorie total for the day.</p>
        </div>
        <strong className="food-total">{total} kcal</strong>
      </div>

      <label className="food-search">
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
          {hits.map((hit) => (
            <button
              className="food-hit"
              type="button"
              key={hit.id}
              onClick={() => {
                setPicked(hit);
                setGrams(hit.servingGrams && hit.servingGrams > 0 ? Math.round(hit.servingGrams) : 100);
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
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="food-list">
          {items.map((item) => (
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
              <strong>{Math.round(item.calories)} kcal</strong>
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
          ))}
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
          <button className="button" type="button" onClick={addCustom}>Add</button>
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
