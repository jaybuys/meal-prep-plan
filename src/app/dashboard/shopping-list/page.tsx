import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ShoppingListItem } from "@/types/database";
import ShoppingListEditor from "./shopping-list-editor";

export default async function ShoppingListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", user.id)
    .order("position");

  const items = (data ?? []) as ShoppingListItem[];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Shopping List</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add items, check them off as you shop, and drag to reorder.
        </p>
      </div>

      <ShoppingListEditor initialItems={items} />
    </div>
  );
}
