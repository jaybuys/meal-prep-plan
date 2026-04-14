"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createRecipe(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const instructions = formData.get("instructions") as string;
  const cuisineType = formData.get("cuisine_type") as string;
  const prepTime = formData.get("prep_time_minutes") as string;
  const cookTime = formData.get("cook_time_minutes") as string;
  const servings = formData.get("servings") as string;

  // Parse ingredients from JSON string
  const ingredientsRaw = formData.get("ingredients") as string;
  let ingredients = [];
  try {
    ingredients = ingredientsRaw ? JSON.parse(ingredientsRaw) : [];
  } catch {
    ingredients = [];
  }

  // Parse dietary flags (multiple checkboxes)
  const dietaryFlags = formData.getAll("dietary_flags") as string[];

  // Parse scores
  const easeScore = formData.get("ease_score") as string;
  const healthScore = formData.get("health_score") as string;
  const tasteScore = formData.get("taste_score") as string;
  const costScore = formData.get("cost_score") as string;

  if (!name || !instructions || !cuisineType) {
    return redirect(
      "/dashboard/recipes/new?error=Name, instructions, and cuisine type are required"
    );
  }

  const { error } = await supabase.from("recipes").insert({
    name,
    description: description || null,
    ingredients,
    instructions,
    cuisine_type: cuisineType,
    dietary_flags: dietaryFlags,
    prep_time_minutes: prepTime ? parseInt(prepTime) : null,
    cook_time_minutes: cookTime ? parseInt(cookTime) : null,
    servings: servings ? parseInt(servings) : null,
    ease_score: easeScore ? parseFloat(easeScore) : null,
    health_score: healthScore ? parseFloat(healthScore) : null,
    taste_score: tasteScore ? parseFloat(tasteScore) : null,
    cost_score: costScore ? parseFloat(costScore) : null,
    created_by: user.id,
  });

  if (error) {
    return redirect(
      "/dashboard/recipes/new?error=" + encodeURIComponent(error.message)
    );
  }

  return redirect("/dashboard?success=Recipe added!");
}

export async function updateRecipe(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const recipeId = formData.get("recipe_id") as string;

  // Check permission: must be creator or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: existing } = await supabase
    .from("recipes")
    .select("created_by")
    .eq("id", recipeId)
    .single();

  if (!existing) {
    return redirect("/dashboard?error=Recipe not found");
  }

  const isAdmin = profile?.role === "admin";
  const isCreator = existing.created_by === user.id;

  if (!isAdmin && !isCreator) {
    return redirect(`/dashboard/recipes/${recipeId}?error=Not authorized`);
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const instructions = formData.get("instructions") as string;
  const cuisineType = formData.get("cuisine_type") as string;
  const prepTime = formData.get("prep_time_minutes") as string;
  const cookTime = formData.get("cook_time_minutes") as string;
  const servings = formData.get("servings") as string;

  const ingredientsRaw = formData.get("ingredients") as string;
  let ingredients = [];
  try {
    ingredients = ingredientsRaw ? JSON.parse(ingredientsRaw) : [];
  } catch {
    ingredients = [];
  }

  const dietaryFlags = formData.getAll("dietary_flags") as string[];

  const easeScore = formData.get("ease_score") as string;
  const healthScore = formData.get("health_score") as string;
  const tasteScore = formData.get("taste_score") as string;
  const costScore = formData.get("cost_score") as string;

  if (!name || !instructions || !cuisineType) {
    return redirect(
      `/dashboard/recipes/${recipeId}/edit?error=Name, instructions, and cuisine type are required`
    );
  }

  const { error } = await supabase
    .from("recipes")
    .update({
      name,
      description: description || null,
      ingredients,
      instructions,
      cuisine_type: cuisineType,
      dietary_flags: dietaryFlags,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      ease_score: easeScore ? parseFloat(easeScore) : null,
      health_score: healthScore ? parseFloat(healthScore) : null,
      taste_score: tasteScore ? parseFloat(tasteScore) : null,
      cost_score: costScore ? parseFloat(costScore) : null,
    })
    .eq("id", recipeId);

  if (error) {
    return redirect(
      `/dashboard/recipes/${recipeId}/edit?error=` +
        encodeURIComponent(error.message)
    );
  }

  return redirect(`/dashboard/recipes/${recipeId}?success=Recipe updated!`);
}

export async function toggleFavorite(recipeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .single();

  if (existing) {
    // Unfavorite
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    // Favorite
    await supabase
      .from("favorites")
      .insert({ user_id: user.id, recipe_id: recipeId });
  }

  revalidatePath(`/dashboard/recipes/${recipeId}`);
  revalidatePath("/dashboard/favorites");
  return { favorited: !existing };
}
