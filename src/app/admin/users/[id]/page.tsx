import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Profile } from "@/types/database";
import { USER_ROLES } from "@/types/database";
import { updateUserProfile, deleteUser } from "../../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function AdminUserEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const profile = data as Profile;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to users
        </Link>
        <h1 className="mt-2 text-3xl font-bold">
          {profile.display_name ?? "Unnamed User"}
        </h1>
        <p className="text-sm text-muted-foreground">ID: {profile.id}</p>
      </div>

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

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
            <CardDescription>
              Update this user&apos;s profile and role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateUserProfile} className="space-y-4">
              <input type="hidden" name="user_id" value={profile.id} />

              <div className="space-y-2">
                <Label htmlFor="display_name">Display name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={profile.display_name ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={profile.role}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile.bio ?? ""}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Joined:</span>{" "}
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>{" "}
                  {new Date(profile.updated_at).toLocaleDateString()}
                </div>
              </div>

              {profile.dietary_preferences.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Dietary preferences:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {profile.dietary_preferences.map((pref) => (
                      <Badge key={pref} variant="outline">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.favorite_cuisines.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Favorite cuisines:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {profile.favorite_cuisines.map((cuisine) => (
                      <Badge key={cuisine} variant="outline">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Remove this user&apos;s profile. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteUser}>
              <input type="hidden" name="user_id" value={profile.id} />
              <Button type="submit" variant="destructive">
                Delete user profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
