"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ShoppingListItem } from "@/types/database";

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", user.id)
    .order("position");

  return (data ?? []) as ShoppingListItem[];
}

export async function addShoppingListItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const quantity = (formData.get("quantity") as string)?.trim() || null;

  if (!name) return;

  // Get the highest position
  const { data: last } = await supabase
    .from("shopping_list_items")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (last?.position ?? -1) + 1;

  await supabase.from("shopping_list_items").insert({
    user_id: user.id,
    name,
    quantity,
    position: nextPosition,
  });

  revalidatePath("/dashboard/shopping-list");
}

export async function addIngredientsToShoppingList(
  ingredients: { name: string; quantity: string | number | null; unit?: string }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (ingredients.length === 0) return;

  // Get the highest position
  const { data: last } = await supabase
    .from("shopping_list_items")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const startPosition = (last?.position ?? -1) + 1;

  const rows = ingredients.map((ing, i) => {
    const parts: string[] = [];
    if (ing.quantity) parts.push(String(ing.quantity));
    if (ing.unit) parts.push(ing.unit);
    const qty = parts.length > 0 ? parts.join(" ") : null;
    return {
      user_id: user.id,
      name: ing.name.trim(),
      quantity: qty,
      position: startPosition + i,
    };
  });

  await supabase.from("shopping_list_items").insert(rows);
  revalidatePath("/dashboard/shopping-list");
}

export async function updateShoppingListItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const quantity = (formData.get("quantity") as string)?.trim() || null;

  if (!id || !name) return;

  await supabase
    .from("shopping_list_items")
    .update({ name, quantity, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/shopping-list");
}

export async function deleteShoppingListItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/shopping-list");
}

export async function toggleShoppingListItem(id: string, checked: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("shopping_list_items")
    .update({ checked, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/shopping-list");
}

export async function reorderShoppingList(orderedIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Update positions in bulk
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("shopping_list_items")
      .update({ position: index })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  await Promise.all(updates);
  revalidatePath("/dashboard/shopping-list");
}

export async function clearCheckedItems() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", user.id)
    .eq("checked", true);

  revalidatePath("/dashboard/shopping-list");
}

export async function clearAllItems() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", user.id);

  revalidatePath("/dashboard/shopping-list");
}
