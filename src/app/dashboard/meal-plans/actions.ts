"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { MealPlanEntryInsert } from "@/types/database";

export async function createMealPlan(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const weekStart = formData.get("week_start") as string;
  const name = (formData.get("name") as string) || null;

  if (!weekStart) {
    return redirect("/dashboard/meal-plans/new?error=Week start date is required");
  }

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .insert({ user_id: user.id, week_start: weekStart, name })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return redirect("/dashboard/meal-plans/new?error=A plan for that week already exists");
    }
    return redirect(`/dashboard/meal-plans/new?error=${encodeURIComponent(error.message)}`);
  }

  return redirect(`/dashboard/meal-plans/${plan.id}/edit`);
}

export async function saveMealPlanEntries(
  planId: string,
  entries: Omit<MealPlanEntryInsert, "meal_plan_id">[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (!plan) {
    return { error: "Meal plan not found" };
  }

  // Delete existing entries and replace with new ones
  await supabase.from("meal_plan_entries").delete().eq("meal_plan_id", planId);

  if (entries.length > 0) {
    const rows = entries.map((e) => ({ ...e, meal_plan_id: planId }));
    const { error } = await supabase.from("meal_plan_entries").insert(rows);
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/dashboard/meal-plans");
  revalidatePath(`/dashboard/meal-plans/${planId}`);
  return { error: null };
}

export async function updateMealPlanName(planId: string, name: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("meal_plans")
    .update({ name })
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/meal-plans");
  return { error: null };
}

export async function deleteMealPlan(planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  await supabase.from("meal_plans").delete().eq("id", planId).eq("user_id", user.id);

  revalidatePath("/dashboard/meal-plans");
  return redirect("/dashboard/meal-plans");
}
