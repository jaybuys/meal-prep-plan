import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { MealPlan, MealPlanEntry, Profile, Recipe } from "@/types/database";
import MealPlanEditor from "./meal-plan-editor";

// Same matching logic used on /dashboard/recommendations
const SCORE_RANGES: Record<string, { lower: number; upper: number | null }> = {
  ease:   { lower: 1, upper: null },
  health: { lower: 0, upper: null },
  taste:  { lower: 0, upper: null },
  cost:   { lower: 0.5, upper: null },
};

function isRecommended(
  recipe: { ease_score: number | null; health_score: number | null; taste_score: number | null; cost_score: number | null },
  prefs: { ease: number | null; health: number | null; taste: number | null; cost: number | null }
): boolean {
  const checks = [
    { key: "ease",   pref: prefs.ease,   score: recipe.ease_score },
    { key: "health", pref: prefs.health, score: recipe.health_score },
    { key: "taste",  pref: prefs.taste,  score: recipe.taste_score },
    { key: "cost",   pref: prefs.cost,   score: recipe.cost_score },
  ];

  let matched = 0;
  for (const { key, pref, score } of checks) {
    if (pref == null) continue;
    if (score == null) continue;
    const range = SCORE_RANGES[key];
    const min = pref - range.lower;
    const max = range.upper != null ? pref + range.upper : 5;
    if (score < min || score > max) return false;
    matched++;
  }
  return matched > 0;
}

export default async function EditMealPlanPage({
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

  // Load existing entries
  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("*")
    .eq("meal_plan_id", id);

  // Load all recipes (include scores for recommendation matching)
  const { data: allRecipes } = await supabase
    .from("recipes")
    .select("id, name, cuisine_type, prep_time_minutes, cook_time_minutes, ease_score, health_score, taste_score, cost_score")
    .order("name");

  // Load user's favorites
  const { data: favorites } = await supabase
    .from("favorites")
    .select("recipe_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set((favorites ?? []).map((f) => f.recipe_id));

  // Load user preferences for recommendation matching
  const { data: profileData } = await supabase
    .from("profiles")
    .select("pref_ease_score, pref_health_score, pref_taste_score, pref_cost_score")
    .eq("id", user.id)
    .single();

  const p = profileData as Pick<
    Profile,
    "pref_ease_score" | "pref_health_score" | "pref_taste_score" | "pref_cost_score"
  > | null;

  const prefs = {
    ease: p?.pref_ease_score ?? null,
    health: p?.pref_health_score ?? null,
    taste: p?.pref_taste_score ?? null,
    cost: p?.pref_cost_score ?? null,
  };

  const hasPreferences = Object.values(prefs).some((v) => v != null);

  type RecipeWithScores = Pick<Recipe, "id" | "name" | "cuisine_type" | "prep_time_minutes" | "cook_time_minutes" | "ease_score" | "health_score" | "taste_score" | "cost_score">;
  const allRecipesList = (allRecipes ?? []) as RecipeWithScores[];

  // Compute recommended IDs
  const recommendedIds = hasPreferences
    ? new Set(allRecipesList.filter((r) => isRecommended(r, prefs)).map((r) => r.id))
    : new Set<string>();

  // Sort recipes: favorites first, then recommended, then alphabetical
  const recipes = allRecipesList.sort((a, b) => {
    const aFav = favoriteIds.has(a.id) ? 0 : 1;
    const bFav = favoriteIds.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    const aRec = recommendedIds.has(a.id) ? 0 : 1;
    const bRec = recommendedIds.has(b.id) ? 0 : 1;
    if (aRec !== bRec) return aRec - bRec;
    return a.name.localeCompare(b.name);
  });

  return (
    <MealPlanEditor
      plan={plan as MealPlan}
      entries={(entries ?? []) as MealPlanEntry[]}
      recipes={recipes}
      favoriteIds={Array.from(favoriteIds)}
      recommendedIds={Array.from(recommendedIds)}
    />
  );
}
