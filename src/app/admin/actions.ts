"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Not authorized");
  }

  return { supabase, user };
}

export async function updateUserRole(formData: FormData) {
  const { supabase } = await verifyAdmin();

  const userId = formData.get("user_id") as string;
  const role = formData.get("role") as string;

  if (!["user", "admin"].includes(role)) {
    return redirect("/admin/users?error=Invalid role");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return redirect(
      "/admin/users?error=" + encodeURIComponent(error.message)
    );
  }

  return redirect("/admin/users?success=Role updated");
}

export async function updateUserProfile(formData: FormData) {
  const { supabase } = await verifyAdmin();

  const userId = formData.get("user_id") as string;
  const displayName = formData.get("display_name") as string;
  const role = formData.get("role") as string;
  const bio = formData.get("bio") as string;

  const updates: Partial<Profile> = {
    display_name: displayName,
    role: role as Profile["role"],
    bio: bio || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return redirect(
      `/admin/users/${userId}?error=` + encodeURIComponent(error.message)
    );
  }

  return redirect(`/admin/users/${userId}?success=Profile updated`);
}

export async function createUser(formData: FormData) {
  const { supabase } = await verifyAdmin();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const role = formData.get("role") as string;

  if (!email || !password) {
    return redirect("/admin/users/new?error=Email and password are required");
  }

  if (!["user", "admin"].includes(role)) {
    return redirect("/admin/users/new?error=Invalid role");
  }

  // Sign up the new user via Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    return redirect(
      "/admin/users/new?error=" + encodeURIComponent(error.message)
    );
  }

  // If the user was created and role is admin, update their profile
  if (data.user && role === "admin") {
    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", data.user.id);
  }

  return redirect("/admin/users?success=User created");
}

export async function deleteUser(formData: FormData) {
  const userId = formData.get("user_id") as string;

  // Deleting from auth.users requires the service_role key,
  // which we don't have on the client-side Supabase instance.
  // For now, we just remove the profile (auth user remains but is orphaned).
  // A proper implementation would use a Supabase Edge Function or admin API.
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    return redirect(
      "/admin/users?error=" + encodeURIComponent(error.message)
    );
  }

  return redirect("/admin/users?success=User removed");
}
