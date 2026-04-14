import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Recipe } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import FavoriteButton from "./favorite-button";

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error: pageError, success } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const recipe = data as Recipe;

  // Check if current user can edit
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canEdit = false;
  let isFavorited = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    canEdit =
      profile?.role === "admin" || recipe.created_by === user.id;

    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipe.id)
      .single();

    isFavorited = !!fav;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to recipes
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <FavoriteButton
              recipeId={recipe.id}
              initialFavorited={isFavorited}
            />
          )}
          {canEdit && (
            <Link
              href={`/dashboard/recipes/${recipe.id}/edit`}
              className={buttonVariants({ size: "sm" })}
            >
              Edit recipe
            </Link>
          )}
        </div>
      </div>

      {pageError && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {pageError}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{recipe.name}</h1>
          {recipe.description && (
            <p className="mt-2 text-lg text-muted-foreground">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>{recipe.cuisine_type}</Badge>
          {recipe.dietary_flags.map((flag) => (
            <Badge key={flag} variant="outline">
              {flag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground">
          {recipe.prep_time_minutes != null && (
            <div>
              <span className="font-medium text-foreground">
                {recipe.prep_time_minutes}
              </span>{" "}
              min prep
            </div>
          )}
          {recipe.cook_time_minutes != null && (
            <div>
              <span className="font-medium text-foreground">
                {recipe.cook_time_minutes}
              </span>{" "}
              min cook
            </div>
          )}
          {recipe.servings != null && (
            <div>
              <span className="font-medium text-foreground">
                {recipe.servings}
              </span>{" "}
              servings
            </div>
          )}
        </div>

        {(recipe.ease_score || recipe.health_score || recipe.taste_score || recipe.cost_score) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {recipe.ease_score != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{recipe.ease_score}</p>
                    <p className="text-sm text-muted-foreground">Ease</p>
                  </div>
                )}
                {recipe.health_score != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{recipe.health_score}</p>
                    <p className="text-sm text-muted-foreground">Health</p>
                  </div>
                )}
                {recipe.taste_score != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{recipe.taste_score}</p>
                    <p className="text-sm text-muted-foreground">Taste</p>
                  </div>
                )}
                {recipe.cost_score != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">{recipe.cost_score}</p>
                    <p className="text-sm text-muted-foreground">Affordability</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {recipe.ingredients.length > 0 && (
          <>
            <Separator />
            <div>
              <h2 className="mb-3 text-xl font-semibold">Ingredients</h2>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-baseline gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      {ing.quantity && (
                        <span className="font-medium">{ing.quantity}</span>
                      )}{" "}
                      {ing.unit && (
                        <span className="text-muted-foreground">
                          {ing.unit}
                        </span>
                      )}{" "}
                      {ing.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator />

        <div>
          <h2 className="mb-3 text-xl font-semibold">Instructions</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {recipe.instructions}
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          Added {new Date(recipe.created_at).toLocaleDateString()} · Last
          updated {new Date(recipe.updated_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
