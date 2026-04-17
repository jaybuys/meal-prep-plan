import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createMealPlan } from "../actions";

export default async function NewMealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const error = params.error;

  // Default to next Monday
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const defaultDate = nextMonday.toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-3xl font-bold">New Meal Plan</h1>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>
            Choose the week and optionally give your plan a name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createMealPlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="week_start">Week starting (Monday)</Label>
              <Input
                id="week_start"
                name="week_start"
                type="date"
                defaultValue={defaultDate}
                required
              />
              <p className="text-xs text-muted-foreground">
                Pick the Monday that starts your meal plan week
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                name="name"
                placeholder='e.g. "Healthy Week" or "Budget Meals"'
              />
            </div>
            <Button type="submit" className="w-full">
              Create & Start Planning
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
