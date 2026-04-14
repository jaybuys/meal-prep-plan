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
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  const recipes = (data ?? []) as Recipe[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recipes</h1>
          <p className="text-muted-foreground">
            {recipes.length} recipe{recipes.length !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/dashboard/recipes/new"
          className={buttonVariants({ size: "sm" })}
        >
          + Add recipe
        </Link>
      </div>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No recipes yet. Add your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/dashboard/recipes/${recipe.id}`}>
            <Card className="flex h-full flex-col transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="line-clamp-1">{recipe.name}</CardTitle>
                {recipe.description && (
                  <CardDescription className="line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                )}
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

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {recipe.ease_score && (
                    <div>
                      <p className="font-semibold">{recipe.ease_score}</p>
                      <p className="text-muted-foreground">Ease</p>
                    </div>
                  )}
                  {recipe.health_score && (
                    <div>
                      <p className="font-semibold">{recipe.health_score}</p>
                      <p className="text-muted-foreground">Health</p>
                    </div>
                  )}
                  {recipe.taste_score && (
                    <div>
                      <p className="font-semibold">{recipe.taste_score}</p>
                      <p className="text-muted-foreground">Taste</p>
                    </div>
                  )}
                  {recipe.cost_score && (
                    <div>
                      <p className="font-semibold">{recipe.cost_score}</p>
                      <p className="text-muted-foreground">Affordability</p>
                    </div>
                  )}
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
