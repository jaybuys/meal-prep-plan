import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecipeForm from "./recipe-form";

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: ingredientRows } = await supabase.rpc("get_distinct_ingredient_names");
  const ingredientNames = (ingredientRows ?? []).map((r: { name: string }) => r.name);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to recipes
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Add Recipe</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <RecipeForm ingredientSuggestions={ingredientNames} />
    </div>
  );
}
