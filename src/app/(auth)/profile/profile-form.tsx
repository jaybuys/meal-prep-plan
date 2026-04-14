"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileUpdate } from "@/types/database";
import { DIETARY_FLAGS, CUISINE_TYPES } from "@/types/database";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { logout } from "../actions";

interface ProfileFormProps {
  profile: Profile;
  email: string;
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    profile.dietary_preferences ?? []
  );
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(
    profile.favorite_cuisines ?? []
  );
  const [prefEase, setPrefEase] = useState<number | null>(profile.pref_ease_score);
  const [prefHealth, setPrefHealth] = useState<number | null>(profile.pref_health_score);
  const [prefTaste, setPrefTaste] = useState<number | null>(profile.pref_taste_score);
  const [prefCost, setPrefCost] = useState<number | null>(profile.pref_cost_score);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function toggleDietaryFlag(flag: string) {
    setDietaryPreferences((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  }

  function toggleCuisine(cuisine: string) {
    setFavoriteCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const updates: ProfileUpdate = {
      display_name: displayName,
      bio,
      dietary_preferences: dietaryPreferences as Profile["dietary_preferences"],
      favorite_cuisines: favoriteCuisines as Profile["favorite_cuisines"],
      pref_ease_score: prefEase,
      pref_health_score: prefHealth,
      pref_taste_score: prefTaste,
      pref_cost_score: prefCost,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated!" });
    }

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
          <CardDescription>Your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed here
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your cooking style..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dietary Preferences</CardTitle>
          <CardDescription>
            Select any that apply — these help personalize your recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {DIETARY_FLAGS.map((flag) => (
              <label
                key={flag}
                className="flex cursor-pointer items-center gap-2"
              >
                <Checkbox
                  checked={dietaryPreferences.includes(flag)}
                  onCheckedChange={() => toggleDietaryFlag(flag)}
                />
                <span className="text-sm">{flag}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorite Cuisines</CardTitle>
          <CardDescription>
            Pick cuisines you enjoy — click to toggle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CUISINE_TYPES.map((cuisine) => (
              <Badge
                key={cuisine}
                variant={
                  favoriteCuisines.includes(cuisine) ? "default" : "outline"
                }
                className="cursor-pointer select-none"
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisine}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Preferences</CardTitle>
          <CardDescription>
            Set your preferred thresholds for recipe scores (1–5). These will be
            used to recommend recipes that match your priorities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "Ease", value: prefEase, setter: setPrefEase, description: "How easy should recipes be to prepare?" },
            { label: "Health", value: prefHealth, setter: setPrefHealth, description: "How healthy should the meals be?" },
            { label: "Taste", value: prefTaste, setter: setPrefTaste, description: "How important is great taste?" },
            { label: "Affordability", value: prefCost, setter: setPrefCost, description: "How budget-friendly should meals be?" },
          ].map(({ label, value, setter, description }) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums w-8 text-right">
                  {value ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">1</span>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={[value ?? 3]}
                  onValueChange={(newValue) => {
                    const v = Array.isArray(newValue) ? newValue[0] : newValue;
                    setter(v);
                  }}
                />
                <span className="text-xs text-muted-foreground w-4">5</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Tip: A higher number means you care more about that quality.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <form action={logout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
