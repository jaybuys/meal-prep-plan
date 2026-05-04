"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
// ShoppingListItem type used by page.tsx

// ─── Helpers ───────────────────────────────────────────────────

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * Resolve which user's list to operate on.
 * If the current user is viewing a shared list, listOwnerId will be the
 * owner's ID. Otherwise it defaults to the current user.
 */
async function resolveListOwner(listOwnerId?: string) {
  const { supabase, user } = await getUser();
  const ownerId = listOwnerId ?? user.id;

  // If operating on someone else's list, verify share exists (RLS also enforces this)
  if (ownerId !== user.id) {
    const { data: share } = await supabase
      .from("shopping_list_shares")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("shared_with_id", user.id)
      .single();
    if (!share) {
      throw new Error("Not authorized to access this shopping list");
    }
  }

  return { supabase, user, ownerId };
}

// ─── Sharing actions ───────────────────────────────────────────

export async function shareShoppingList(email: string) {
  const { supabase, user } = await getUser();

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Email is required" };

  // Look up the target user by email via Postgres function
  const { data: targetUserId, error: lookupError } = await supabase
    .rpc("get_user_id_by_email", { lookup_email: trimmed });

  if (lookupError || !targetUserId) {
    return { error: "No account found with that email address" };
  }

  if (targetUserId === user.id) {
    return { error: "You can't share with yourself" };
  }

  // Check if already shared
  const { data: existing } = await supabase
    .from("shopping_list_shares")
    .select("id")
    .eq("owner_id", user.id)
    .eq("shared_with_id", targetUserId)
    .single();

  if (existing) {
    return { error: "Already shared with this user" };
  }

  const { error } = await supabase.from("shopping_list_shares").insert({
    owner_id: user.id,
    shared_with_id: targetUserId,
  });

  if (error) {
    return { error: "Failed to share list" };
  }

  revalidatePath("/dashboard/shopping-list");
  return { success: true };
}

export async function unshareShoppingList(shareId: string) {
  const { supabase } = await getUser();

  await supabase
    .from("shopping_list_shares")
    .delete()
    .eq("id", shareId);

  revalidatePath("/dashboard/shopping-list");
}

export async function leaveSharedList(shareId: string) {
  const { supabase } = await getUser();

  await supabase
    .from("shopping_list_shares")
    .delete()
    .eq("id", shareId);

  revalidatePath("/dashboard/shopping-list");
}

// ─── Item CRUD actions ─────────────────────────────────────────

export async function addShoppingListItem(formData: FormData) {
  const listOwnerId = formData.get("list_owner_id") as string | null;
  const { supabase, ownerId } = await resolveListOwner(listOwnerId || undefined);

  const name = (formData.get("name") as string)?.trim();
  const quantity = (formData.get("quantity") as string)?.trim() || null;

  if (!name) return;

  const { data: last } = await supabase
    .from("shopping_list_items")
    .select("position")
    .eq("user_id", ownerId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (last?.position ?? -1) + 1;

  await supabase.from("shopping_list_items").insert({
    user_id: ownerId,
    name,
    quantity,
    position: nextPosition,
  });

  revalidatePath("/dashboard/shopping-list");
}

export async function addIngredientsToShoppingList(
  ingredients: { name: string; quantity: string | number | null; unit?: string }[],
  listOwnerId?: string
) {
  const { supabase, ownerId } = await resolveListOwner(listOwnerId);

  if (ingredients.length === 0) return;

  const { data: last } = await supabase
    .from("shopping_list_items")
    .select("position")
    .eq("user_id", ownerId)
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
      user_id: ownerId,
      name: ing.name.trim(),
      quantity: qty,
      position: startPosition + i,
    };
  });

  await supabase.from("shopping_list_items").insert(rows);
  revalidatePath("/dashboard/shopping-list");
}

export async function updateShoppingListItem(formData: FormData) {
  const { supabase } = await getUser();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const quantity = (formData.get("quantity") as string)?.trim() || null;

  if (!id || !name) return;

  // RLS handles access control — no need to filter by user_id
  await supabase
    .from("shopping_list_items")
    .update({ name, quantity, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/dashboard/shopping-list");
}

export async function deleteShoppingListItem(id: string) {
  const { supabase } = await getUser();

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id);

  revalidatePath("/dashboard/shopping-list");
}

export async function toggleShoppingListItem(id: string, checked: boolean) {
  const { supabase } = await getUser();

  await supabase
    .from("shopping_list_items")
    .update({ checked, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/dashboard/shopping-list");
}

export async function reorderShoppingList(orderedIds: string[]) {
  const { supabase } = await getUser();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("shopping_list_items")
      .update({ position: index })
      .eq("id", id)
  );

  await Promise.all(updates);
  revalidatePath("/dashboard/shopping-list");
}

export async function clearCheckedItems(listOwnerId?: string) {
  const { supabase, ownerId } = await resolveListOwner(listOwnerId);

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", ownerId)
    .eq("checked", true);

  revalidatePath("/dashboard/shopping-list");
}

export async function clearAllItems(listOwnerId?: string) {
  const { supabase, ownerId } = await resolveListOwner(listOwnerId);

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", ownerId);

  revalidatePath("/dashboard/shopping-list");
}
