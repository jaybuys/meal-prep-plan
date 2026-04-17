import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { MealPlan } from "@/types/database";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart, Pencil } from "lucide-react";

export default async function MealPlansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plans } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false });

  const mealPlans = (plans ?? []) as MealPlan[];

  // Get entry counts per plan
  const planIds = mealPlans.map((p) => p.id);
  const entryCounts: Record<string, number> = {};

  if (planIds.length > 0) {
    const { data: entries } = await supabase
      .from("meal_plan_entries")
      .select("meal_plan_id")
      .in("meal_plan_id", planIds);

    if (entries) {
      for (const e of entries) {
        entryCounts[e.meal_plan_id] = (entryCounts[e.meal_plan_id] || 0) + 1;
      }
    }
  }

  function formatWeek(weekStart: string) {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Meal Plans</h1>
          <p className="text-muted-foreground">
            Plan your weekly meals with breakfast, lunch, and dinner
          </p>
        </div>
        <Link
          href="/dashboard/meal-plans/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Link>
      </div>

      {mealPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              You haven&apos;t created any meal plans yet.
            </p>
            <Link
              href="/dashboard/meal-plans/new"
              className={buttonVariants({ variant: "default" })}
            >
              Create your first plan
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mealPlans.map((plan) => {
            const count = entryCounts[plan.id] || 0;
            return (
              <Card key={plan.id} className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {plan.name || "Meal Plan"}
                  </CardTitle>
                  <CardDescription>{formatWeek(plan.week_start)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Badge variant="outline" className="w-fit">
                    {count} / 21 meals planned
                  </Badge>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/meal-plans/${plan.id}/edit`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Link>
                    {count > 0 && (
                      <Link
                        href={`/dashboard/meal-plans/${plan.id}/shopping-list`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                        Shopping List
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
