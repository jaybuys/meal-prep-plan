"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function requireInviteCookie() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const ok = cookieStore.get("invite_ok")?.value === "true";
  if (!ok) {
    redirect(
      "/invite?error=" +
        encodeURIComponent("You need an invite code to create an account")
    );
  }
}


function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function signInWithGoogle(intent: "login" | "register" = "login") {
  const supabase = await createClient();
  const baseUrl = getBaseUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?intent=${intent}`,
    },
  });

  if (error) {
    const errorPage = intent === "register" ? "/register" : "/login";
    return redirect(`${errorPage}?error=` + encodeURIComponent(error.message));
  }

  return redirect(data.url);
}

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
  await requireInviteCookie();
  const supabase = await createClient();
  const baseUrl = getBaseUrl();

  const displayName = formData.get("display_name") as string;

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: `${baseUrl}/api/auth/callback`,
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
  const baseUrl = getBaseUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${baseUrl}/api/auth/callback?next=/reset-password`,
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
