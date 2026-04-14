"use client";

import { useState } from "react";
import { createRecipe } from "../../actions";
import { CUISINE_TYPES, DIETARY_FLAGS } from "@/types/database";
import type { Ingredient } from "@/types/database";
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
import { Separator } from "@/components/ui/separator";

export default function RecipeForm() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: "", unit: "" },
  ]);

  function addIngredient() {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(
    index: number,
    field: keyof Ingredient,
    value: string
  ) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  return (
    <form action={createRecipe} className="space-y-6">
      <input
        type="hidden"
        name="ingredients"
        value={JSON.stringify(
          ingredients.filter((i) => i.name.trim() !== "")
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Recipe name *</Label>
            <Input id="name" name="name" placeholder="e.g. Chicken Tikka Masala" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A short summary of this recipe..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisine_type">Cuisine type *</Label>
            <select
              id="cuisine_type"
              name="cuisine_type"
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select cuisine...</option>
              {CUISINE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep_time_minutes">Prep (min)</Label>
              <Input
                id="prep_time_minutes"
                name="prep_time_minutes"
                type="number"
                min={0}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook_time_minutes">Cook (min)</Label>
              <Input
                id="cook_time_minutes"
                name="cook_time_minutes"
                type="number"
                min={0}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                name="servings"
                type="number"
                min={1}
                placeholder="4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
          <CardDescription>Add each ingredient with quantity and unit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                {i === 0 && (
                  <Label className="text-xs text-muted-foreground">Name</Label>
                )}
                <Input
                  placeholder="e.g. Chicken breast"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                />
              </div>
              <div className="w-20 space-y-1">
                {i === 0 && (
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                )}
                <Input
                  placeholder="2"
                  value={ing.quantity}
                  onChange={(e) =>
                    updateIngredient(i, "quantity", e.target.value)
                  }
                />
              </div>
              <div className="w-24 space-y-1">
                {i === 0 && (
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                )}
                <Input
                  placeholder="lbs"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                />
              </div>
              {ingredients.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIngredient(i)}
                >
                  &times;
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
            + Add ingredient
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="instructions"
            placeholder="Step-by-step cooking instructions..."
            rows={6}
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dietary Flags</CardTitle>
          <CardDescription>Select all that apply</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {DIETARY_FLAGS.map((flag) => (
              <label key={flag} className="flex cursor-pointer items-center gap-2">
                <Checkbox name="dietary_flags" value={flag} />
                <span className="text-sm">{flag}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scores</CardTitle>
          <CardDescription>Rate from 1 (low) to 5 (high)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="ease_score">Ease</Label>
              <Input
                id="ease_score"
                name="ease_score"
                type="number"
                min={1}
                max={5}
                step={0.1}
                placeholder="1-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_score">Health</Label>
              <Input
                id="health_score"
                name="health_score"
                type="number"
                min={1}
                max={5}
                step={0.1}
                placeholder="1-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taste_score">Taste</Label>
              <Input
                id="taste_score"
                name="taste_score"
                type="number"
                min={1}
                max={5}
                step={0.1}
                placeholder="1-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_score">Affordability</Label>
              <Input
                id="cost_score"
                name="cost_score"
                type="number"
                min={1}
                max={5}
                step={0.1}
                placeholder="1-5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3">
        <Button type="submit">Add recipe</Button>
        <a
          href="/dashboard"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
