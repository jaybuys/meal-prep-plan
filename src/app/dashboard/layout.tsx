import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import ProfileDropdown from "./profile-dropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const p = profile as Pick<Profile, "display_name" | "role"> | null;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              Meal Planner
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                Recipes
              </Link>
              <Link
                href="/dashboard/popular"
                className="text-muted-foreground hover:text-foreground"
              >
                Most Popular
              </Link>
              <Link
                href="/dashboard/recommendations"
                className="text-muted-foreground hover:text-foreground"
              >
                Recommendations
              </Link>
            </nav>
          </div>
          <ProfileDropdown
            displayName={p?.display_name ?? null}
            email={user.email ?? ""}
            isAdmin={p?.role === "admin"}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
