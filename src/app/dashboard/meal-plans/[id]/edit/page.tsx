import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { MealPlan, MealPlanEntry, Recipe } from "@/types/database";
import MealPlanEditor from "./meal-plan-editor";

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

  // Load all recipes
  const { data: allRecipes } = await supabase
    .from("recipes")
    .select("id, name, cuisine_type, prep_time_minutes, cook_time_minutes")
    .order("name");

  // Load user's favorites
  const { data: favorites } = await supabase
    .from("favorites")
    .select("recipe_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set((favorites ?? []).map((f) => f.recipe_id));

  // Sort recipes: favorites first, then alphabetical
  const recipes = ((allRecipes ?? []) as Pick<Recipe, "id" | "name" | "cuisine_type" | "prep_time_minutes" | "cook_time_minutes">[]).sort(
    (a, b) => {
      const aFav = favoriteIds.has(a.id) ? 0 : 1;
      const bFav = favoriteIds.has(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.name.localeCompare(b.name);
    }
  );

  return (
    <MealPlanEditor
      plan={plan as MealPlan}
      entries={(entries ?? []) as MealPlanEntry[]}
      recipes={recipes}
      favoriteIds={Array.from(favoriteIds)}
    />
  );
}
