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
