// ============================================================
// Database types — keep in sync with Supabase migrations
// ============================================================

export interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  ingredients: Ingredient[];
  instructions: string;
  cuisine_type: string;
  dietary_flags: DietaryFlag[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  image_url: string | null;
  ease_score: number | null;
  health_score: number | null;
  taste_score: number | null;
  cost_score: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type RecipeInsert = Omit<Recipe, "id" | "created_at" | "updated_at">;
export type RecipeUpdate = Partial<RecipeInsert>;

// ============================================================
// Enums / constants
// ============================================================

export const DIETARY_FLAGS = [
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Keto",
  "Paleo",
  "Low-Carb",
  "Low-Sodium",
  "Halal",
  "Kosher",
] as const;

export type DietaryFlag = (typeof DIETARY_FLAGS)[number];

export const CUISINE_TYPES = [
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "French",
  "Greek",
  "Mediterranean",
  "Korean",
  "Vietnamese",
  "American",
  "Middle Eastern",
  "African",
  "Caribbean",
  "Other",
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

// ============================================================
// Profile types
// ============================================================

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  dietary_preferences: DietaryFlag[];
  favorite_cuisines: CuisineType[];
  pref_ease_score: number | null;
  pref_health_score: number | null;
  pref_taste_score: number | null;
  pref_cost_score: number | null;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<
  Pick<Profile, "display_name" | "avatar_url" | "bio" | "dietary_preferences" | "favorite_cuisines" | "pref_ease_score" | "pref_health_score" | "pref_taste_score" | "pref_cost_score">
>;

export type AdminProfileUpdate = Partial<
  Pick<Profile, "display_name" | "role" | "bio" | "dietary_preferences" | "favorite_cuisines">
>;

// ============================================================
// Favorite types
// ============================================================

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

// ============================================================
// Meal Plan types
// ============================================================

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface MealPlan {
  id: string;
  user_id: string;
  week_start: string; // date string (YYYY-MM-DD)
  name: string | null;
  created_at: string;
  updated_at: string;
}

export type MealPlanInsert = Pick<MealPlan, "user_id" | "week_start"> &
  Partial<Pick<MealPlan, "name">>;

export interface MealPlanEntry {
  id: string;
  meal_plan_id: string;
  day_of_week: number; // 0=Mon … 6=Sun
  meal_type: MealType;
  recipe_id: string;
  created_at: string;
}

export type MealPlanEntryInsert = Pick<
  MealPlanEntry,
  "meal_plan_id" | "day_of_week" | "meal_type" | "recipe_id"
>;

// Joined entry with recipe data for display
export type MealPlanEntryWithRecipe = MealPlanEntry & {
  recipe: Pick<Recipe, "id" | "name" | "cuisine_type" | "prep_time_minutes" | "cook_time_minutes">;
};
