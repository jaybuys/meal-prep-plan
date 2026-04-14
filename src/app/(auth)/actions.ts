"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return redirect("/login?error=" + encodeURIComponent(error.message));
  }

  return redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "";

  const displayName = formData.get("display_name") as string;

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    return redirect("/register?error=" + encodeURIComponent(error.message));
  }

  return redirect("/register?success=Check your email to confirm your account");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "";

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
    }
  );

  if (error) {
    return redirect(
      "/forgot-password?error=" + encodeURIComponent(error.message)
    );
  }

  return redirect(
    "/forgot-password?success=Check your email for a password reset link"
  );
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (password !== confirmPassword) {
    return redirect("/reset-password?error=Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirect(
      "/reset-password?error=" + encodeURIComponent(error.message)
    );
  }

  return redirect("/login?success=Password updated successfully. Please log in.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
