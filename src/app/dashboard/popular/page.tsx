import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart } from "lucide-react";

export default async function PopularPage() {
  const supabase = await createClient();

  // Get favorite counts per recipe, ordered by count descending
  const { data: favCounts } = await supabase
    .from("favorites")
    .select("recipe_id");

  // Tally up counts
  const countMap = new Map<string, number>();
  for (const row of favCounts ?? []) {
    countMap.set(row.recipe_id, (countMap.get(row.recipe_id) ?? 0) + 1);
  }

  // Sort by count descending
  const sorted = [...countMap.entries()].sort((a, b) => b[1] - a[1]);
  const recipeIds = sorted.map(([id]) => id);

  let recipes: (Recipe & { saveCount: number })[] = [];
  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from("recipes")
      .select("*")
      .in("id", recipeIds);

    const recipeMap = new Map((data ?? []).map((r) => [r.id, r]));
    recipes = recipeIds
      .map((id) => {
        const r = recipeMap.get(id);
        if (!r) return null;
        return { ...r, saveCount: countMap.get(id) ?? 0 } as Recipe & {
          saveCount: number;
        };
      })
      .filter(Boolean) as (Recipe & { saveCount: number })[];
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Most Popular</h1>
        <p className="text-muted-foreground">
          Recipes ranked by number of saves
        </p>
      </div>

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No recipes have been saved yet. Be the first to{" "}
              <Link href="/dashboard" className="text-primary hover:underline">
                explore recipes
              </Link>
              !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, index) => (
            <Link key={recipe.id} href={`/dashboard/recipes/${recipe.id}`}>
              <Card className="flex h-full flex-col transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="line-clamp-1">
                        {recipe.name}
                      </CardTitle>
                      {recipe.description && (
                        <CardDescription className="line-clamp-2">
                          {recipe.description}
                        </CardDescription>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{recipe.cuisine_type}</Badge>
                    {recipe.dietary_flags.map((flag) => (
                      <Badge key={flag} variant="outline" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <span>
                      {recipe.saveCount} save
                      {recipe.saveCount !== 1 && "s"}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {recipe.prep_time_minutes && (
                      <span>Prep: {recipe.prep_time_minutes}m</span>
                    )}
                    {recipe.cook_time_minutes && (
                      <span>Cook: {recipe.cook_time_minutes}m</span>
                    )}
                    {recipe.servings && (
                      <span>Serves: {recipe.servings}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
