import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { MealPlan, Recipe, Ingredient } from "@/types/database";
import { DAYS_OF_WEEK, MEAL_TYPES } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CombinedIngredient {
  name: string;
  unit: string;
  totalQuantity: number;
  rawQuantities: string[]; // original quantities when they can't be parsed
  sources: string[]; // recipe names this ingredient comes from
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  const aliases: Record<string, string> = {
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    cup: "cup",
    cups: "cup",
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    clove: "clove",
    cloves: "clove",
    can: "can",
    cans: "can",
    piece: "piece",
    pieces: "piece",
    slice: "slice",
    slices: "slice",
    g: "g",
    gram: "g",
    grams: "g",
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    l: "l",
    liter: "l",
    liters: "l",
  };
  return aliases[u] ?? u;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function parseQuantity(qty: number | string): number | null {
  if (typeof qty === "number") return qty;
  const num = parseFloat(qty);
  return isNaN(num) ? null : num;
}

function pluralizeUnit(unit: string, qty: number): string {
  if (qty <= 1) return unit;
  const plurals: Record<string, string> = {
    lb: "lbs",
    oz: "oz",
    cup: "cups",
    tbsp: "tbsp",
    tsp: "tsp",
    clove: "cloves",
    can: "cans",
    piece: "pieces",
    slice: "slices",
    g: "g",
    kg: "kg",
    ml: "ml",
    l: "l",
  };
  return plurals[unit] ?? unit;
}

function combineIngredients(
  allIngredients: { ingredient: Ingredient; recipeName: string }[]
): CombinedIngredient[] {
  const map = new Map<string, CombinedIngredient>();

  for (const { ingredient, recipeName } of allIngredients) {
    const normalName = normalizeName(ingredient.name);
    const normalUnit = normalizeUnit(ingredient.unit);
    const key = `${normalName}|${normalUnit}`;

    const existing = map.get(key);
    const parsedQty = parseQuantity(ingredient.quantity);

    if (existing) {
      if (parsedQty != null) {
        existing.totalQuantity += parsedQty;
      } else {
        existing.rawQuantities.push(String(ingredient.quantity));
      }
      if (!existing.sources.includes(recipeName)) {
        existing.sources.push(recipeName);
      }
    } else {
      map.set(key, {
        name: ingredient.name,
        unit: normalUnit,
        totalQuantity: parsedQty ?? 0,
        rawQuantities: parsedQty == null ? [String(ingredient.quantity)] : [],
        sources: [recipeName],
      });
    }
  }

  // Sort alphabetically by ingredient name
  return Array.from(map.values()).sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}

function formatQuantity(item: CombinedIngredient): string {
  const parts: string[] = [];

  if (item.totalQuantity > 0) {
    // Clean up floating point
    const qty = Math.round(item.totalQuantity * 100) / 100;
    parts.push(String(qty));
  }

  for (const raw of item.rawQuantities) {
    const trimmed = raw.trim();
    if (trimmed) parts.push(trimmed);
  }

  return parts.join(" + ");
}

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load the plan
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!plan) {
    redirect("/dashboard/meal-plans");
  }

  const mealPlan = plan as MealPlan;

  // Load entries with recipe data
  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("day_of_week, meal_type, recipe_id")
    .eq("meal_plan_id", id);

  if (!entries || entries.length === 0) {
    redirect(`/dashboard/meal-plans/${id}/edit`);
  }

  // Load full recipes for ingredients
  const recipeIds = [...new Set(entries.map((e) => e.recipe_id))];
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, name, ingredients")
    .in("id", recipeIds);

  const recipeMap = new Map(
    ((recipes ?? []) as Pick<Recipe, "id" | "name" | "ingredients">[]).map((r) => [r.id, r])
  );

  // Collect all ingredients with their source recipe
  const allIngredients: { ingredient: Ingredient; recipeName: string }[] = [];

  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipe_id);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      allIngredients.push({ ingredient: ing, recipeName: recipe.name });
    }
  }

  const combined = combineIngredients(allIngredients);

  // Build a summary of what's planned
  const mealSummary: { day: string; meal: string; recipeName: string }[] = [];
  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipe_id);
    if (!recipe) continue;
    mealSummary.push({
      day: DAYS_OF_WEEK[entry.day_of_week],
      meal: entry.meal_type,
      recipeName: recipe.name,
    });
  }
  mealSummary.sort((a, b) => {
    const dayA = DAYS_OF_WEEK.indexOf(a.day as (typeof DAYS_OF_WEEK)[number]);
    const dayB = DAYS_OF_WEEK.indexOf(b.day as (typeof DAYS_OF_WEEK)[number]);
    if (dayA !== dayB) return dayA - dayB;
    return MEAL_TYPES.indexOf(a.meal as (typeof MEAL_TYPES)[number]) -
      MEAL_TYPES.indexOf(b.meal as (typeof MEAL_TYPES)[number]);
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/meal-plans"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Meal Plans
          </Link>
          <h1 className="text-3xl font-bold">Shopping List</h1>
          <p className="text-muted-foreground">
            {mealPlan.name || "Meal Plan"} · Week of{" "}
            {new Date(mealPlan.week_start + "T00:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href={`/dashboard/meal-plans/${id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Edit Plan
        </Link>
      </div>

      {/* Shopping list */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Ingredients ({combined.length} item{combined.length !== 1 && "s"})
          </CardTitle>
          <CardDescription>
            Combined from {recipeIds.length} recipe{recipeIds.length !== 1 && "s"} across{" "}
            {entries.length} meal{entries.length !== 1 && "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {combined.map((item, i) => {
              const qty = formatQuantity(item);
              const unit = pluralizeUnit(item.unit, item.totalQuantity);
              return (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-muted-foreground/30" />
                  <div className="flex-1">
                    <span className="font-medium">
                      {qty && `${qty} `}
                      {unit && `${unit} `}
                      {item.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({item.sources.join(", ")})
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Meal summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meal Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {mealSummary.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-24 font-medium">{m.day}</span>
                <Badge variant="outline" className="w-20 justify-center text-xs capitalize">
                  {m.meal}
                </Badge>
                <span className="text-muted-foreground">{m.recipeName}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
