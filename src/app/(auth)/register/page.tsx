import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { register } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GoogleSignInButton from "../google-sign-in-button";

export const dynamic = "force-dynamic";

async function submitInviteCode(formData: FormData) {
  "use server";

  const code = (formData.get("code") as string)?.trim();
  const expected = process.env.INVITE_CODE;

  if (!expected || !code || code !== expected) {
    return redirect(
      "/register?error=" + encodeURIComponent("Invalid invite code")
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("invite_ok", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return redirect("/register?step=create");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; step?: string }>;
}) {
  const { error, success, step } = await searchParams;

  // Only show registration form if step=create AND invite cookie is present
  let showRegistration = false;
  if (step === "create") {
    const cookieStore = await cookies();
    showRegistration = cookieStore.get("invite_ok")?.value === "true";
    if (!showRegistration) {
      redirect("/register?error=" + encodeURIComponent("Invite code required"));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {showRegistration ? "Create an account" : "Invite Required"}
          </CardTitle>
          <CardDescription>
            {showRegistration
              ? "Start planning your meals today"
              : "Enter your invite code to create an account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {!showRegistration ? (
            <form action={submitInviteCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Invite code</Label>
                <Input
                  id="code"
                  name="code"
                  type="password"
                  placeholder="Enter your invite code"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <>
              <form action={register} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display name</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    type="text"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create account
                </Button>
              </form>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <GoogleSignInButton intent="register" />
            </>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
