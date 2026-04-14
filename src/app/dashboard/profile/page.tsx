import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-8 text-3xl font-bold">Your Profile</h1>
      <ProfileForm
        profile={profile as Profile}
        email={user.email ?? ""}
      />
    </div>
  );
}
