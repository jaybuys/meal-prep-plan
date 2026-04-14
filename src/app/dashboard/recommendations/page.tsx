import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Recipe, Profile } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const RANGE = 1; // ±1 point tolerance

type ScoredRecipe = Recipe & { matchScore: number };

function computeMatchScore(
  recipe: Recipe,
  prefs: {
    ease: number | null;
    health: number | null;
    taste: number | null;
    cost: number | null;
  }
): number | null {
  // For each preference that's set AND the recipe has a score,
  // check if the recipe falls within range. If any score is out of
  // range, return null (filtered out). Otherwise return the sum of
  // absolute differences (lower = better match).
  let totalDiff = 0;
  let matched = 0;

  const pairs: [number | null, number | null][] = [
    [prefs.ease, recipe.ease_score],
    [prefs.health, recipe.health_score],
    [prefs.taste, recipe.taste_score],
    [prefs.cost, recipe.cost_score],
  ];

  for (const [pref, score] of pairs) {
    if (pref == null) continue; // user hasn't set this preference — skip
    if (score == null) continue; // recipe doesn't have this score — skip

    const diff = Math.abs(pref - score);
    if (diff > RANGE) return null; // out of range — exclude

    totalDiff += diff;
    matched++;
  }

  // If no preferences matched any recipe scores, don't recommend
  if (matched === 0) return null;

  return totalDiff;
}

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pref_ease_score, pref_health_score, pref_taste_score, pref_cost_score")
    .eq("id", user.id)
    .single();

  const p = profile as Pick<
    Profile,
    "pref_ease_score" | "pref_health_score" | "pref_taste_score" | "pref_cost_score"
  > | null;

  const hasPreferences =
    p &&
    (p.pref_ease_score != null ||
      p.pref_health_score != null ||
      p.pref_taste_score != null ||
      p.pref_cost_score != null);

  let recommendations: ScoredRecipe[] = [];

  if (hasPreferences) {
    const { data: recipes } = await supabase.from("recipes").select("*");

    const prefs = {
      ease: p.pref_ease_score,
      health: p.pref_health_score,
      taste: p.pref_taste_score,
      cost: p.pref_cost_score,
    };

    recommendations = ((recipes ?? []) as Recipe[])
      .map((recipe) => {
        const score = computeMatchScore(recipe, prefs);
        if (score == null) return null;
        return { ...recipe, matchScore: score };
      })
      .filter(Boolean) as ScoredRecipe[];

    // Sort by match score ascending (closest match first)
    recommendations.sort((a, b) => a.matchScore - b.matchScore);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="text-muted-foreground">
          Recipes matched to your score preferences (±{RANGE} point tolerance)
        </p>
      </div>

      {!hasPreferences ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              You haven&apos;t set any score preferences yet. Set your preferred
              thresholds for ease, health, taste, and affordability so we can recommend
              recipes for you.
            </p>
            <Link
              href="/dashboard/profile"
              className={buttonVariants({ variant: "default" })}
            >
              Set preferences
            </Link>
          </CardContent>
        </Card>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No recipes match your current preferences. Try adjusting your
              scores in{" "}
              <Link
                href="/dashboard/profile"
                className="text-primary hover:underline"
              >
                Profile Settings
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {p.pref_ease_score != null && (
              <Badge variant="outline">Ease: {p.pref_ease_score}</Badge>
            )}
            {p.pref_health_score != null && (
              <Badge variant="outline">Health: {p.pref_health_score}</Badge>
            )}
            {p.pref_taste_score != null && (
              <Badge variant="outline">Taste: {p.pref_taste_score}</Badge>
            )}
            {p.pref_cost_score != null && (
              <Badge variant="outline">Affordability: {p.pref_cost_score}</Badge>
            )}
            <span className="self-center">
              — {recommendations.length} recipe
              {recommendations.length !== 1 && "s"} found
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/dashboard/recipes/${recipe.id}`}
              >
                <Card className="flex h-full flex-col transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      {recipe.name}
                    </CardTitle>
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
                        <Badge
                          key={flag}
                          variant="outline"
                          className="text-xs"
                        >
                          {flag}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {recipe.ease_score != null && (
                        <div>
                          <p className="font-semibold">{recipe.ease_score}</p>
                          <p className="text-muted-foreground">Ease</p>
                        </div>
                      )}
                      {recipe.health_score != null && (
                        <div>
                          <p className="font-semibold">
                            {recipe.health_score}
                          </p>
                          <p className="text-muted-foreground">Health</p>
                        </div>
                      )}
                      {recipe.taste_score != null && (
                        <div>
                          <p className="font-semibold">{recipe.taste_score}</p>
                          <p className="text-muted-foreground">Taste</p>
                        </div>
                      )}
                      {recipe.cost_score != null && (
                        <div>
                          <p className="font-semibold">{recipe.cost_score}</p>
                          <p className="text-muted-foreground">Affordability</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex gap-4">
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
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                        {recipe.matchScore === 0
                          ? "Perfect match"
                          : `Δ ${recipe.matchScore.toFixed(1)}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
