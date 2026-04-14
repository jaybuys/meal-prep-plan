import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Recipe } from "@/types/database";
import EditRecipeForm from "./edit-recipe-form";

export default async function EditRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const recipe = data as Recipe;

  // Permission check: must be creator or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const canEdit =
    profile?.role === "admin" || recipe.created_by === user.id;

  if (!canEdit) {
    redirect(`/dashboard/recipes/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/recipes/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to recipe
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Edit Recipe</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <EditRecipeForm recipe={recipe} />
    </div>
  );
}
