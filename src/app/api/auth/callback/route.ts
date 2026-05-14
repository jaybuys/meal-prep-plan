import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function hasInviteCookie(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("invite_ok=true");
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const intent = searchParams.get("intent") ?? "login";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
  }

  // Check if user is already allowlisted (existing user)
  const { data: allow } = await supabase
    .from("registration_allowlist")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (allow) {
    // Existing allowlisted user — let them through regardless of intent
    return NextResponse.redirect(`${origin}${next}`);
  }

  // New user (not allowlisted)
  if (intent === "login") {
    // Login flow: new users are not allowed — sign out and redirect
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "No account found. Please register first with an invite code."
      )}`
    );
  }

  // Register flow: require invite cookie
  if (!hasInviteCookie(request)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/register?error=${encodeURIComponent(
        "Invite code required to create an account"
      )}`
    );
  }

  // Cookie present: allowlist the new user and clear cookie
  await supabase.from("registration_allowlist").insert({ user_id: user.id });

  const res = NextResponse.redirect(`${origin}${next}`);
  res.cookies.set("invite_ok", "", { path: "/", maxAge: 0 });
  return res;
}
