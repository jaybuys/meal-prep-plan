import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ShoppingListItem, Profile } from "@/types/database";
import ShoppingListEditor from "./shopping-list-editor";
import SharePanel from "./share-panel";

export interface SharedListInfo {
  shareId: string;
  ownerId: string;
  ownerName: string;
}

export default async function ShoppingListPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch shares where I am the owner (people I shared with)
  const { data: myShares } = await supabase
    .from("shopping_list_shares")
    .select("id, shared_with_id")
    .eq("owner_id", user.id);

  // Fetch shares where someone shared with me
  const { data: sharedWithMe } = await supabase
    .from("shopping_list_shares")
    .select("id, owner_id")
    .eq("shared_with_id", user.id);

  // Resolve display names for shared users
  const sharedUserIds = [
    ...(myShares ?? []).map((s) => s.shared_with_id),
    ...(sharedWithMe ?? []).map((s) => s.owner_id),
  ];

  let profileMap = new Map<string, string>();
  if (sharedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", sharedUserIds);
    profileMap = new Map(
      ((profiles ?? []) as Pick<Profile, "id" | "display_name">[]).map((p) => [
        p.id,
        p.display_name ?? "User",
      ])
    );
  }

  const myShareList = (myShares ?? []).map((s) => ({
    shareId: s.id,
    userId: s.shared_with_id,
    displayName: profileMap.get(s.shared_with_id) ?? "User",
  }));

  const sharedLists: SharedListInfo[] = (sharedWithMe ?? []).map((s) => ({
    shareId: s.id,
    ownerId: s.owner_id,
    ownerName: profileMap.get(s.owner_id) ?? "User",
  }));

  // Determine which list to view
  const viewingShared = sharedLists.find((s) => s.ownerId === view);
  const listOwnerId = viewingShared ? viewingShared.ownerId : user.id;
  const isOwnList = listOwnerId === user.id;

  // Fetch items for the active list
  const { data } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", listOwnerId)
    .order("position");

  const items = (data ?? []) as ShoppingListItem[];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isOwnList ? "My Shopping List" : `${viewingShared!.ownerName}'s Shopping List`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add items, check them off as you shop, and drag to reorder.
        </p>
      </div>

      {/* Tabs for switching between own and shared lists */}
      {sharedLists.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <a
            href="/dashboard/shopping-list"
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
              isOwnList
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-muted"
            }`}
          >
            My List
          </a>
          {sharedLists.map((s) => (
            <a
              key={s.shareId}
              href={`/dashboard/shopping-list?view=${s.ownerId}`}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                view === s.ownerId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted"
              }`}
            >
              {s.ownerName}&apos;s List
            </a>
          ))}
        </div>
      )}

      <ShoppingListEditor initialItems={items} listOwnerId={listOwnerId} />

      {/* Sharing panel — only on own list */}
      {isOwnList && (
        <div className="mt-8">
          <SharePanel
            myShares={myShareList}
            sharedWithMe={sharedLists}
          />
        </div>
      )}
    </div>
  );
}
