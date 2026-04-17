"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { MealPlan, MealPlanEntry, MealType, Recipe } from "@/types/database";
import { DAYS_OF_WEEK, MEAL_TYPES } from "@/types/database";
import { saveMealPlanEntries, deleteMealPlan } from "../../actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, X, GripVertical, Search, Trash2 } from "lucide-react";

type RecipeSummary = Pick<
  Recipe,
  "id" | "name" | "cuisine_type" | "prep_time_minutes" | "cook_time_minutes"
>;

// Slot key: "0-breakfast" = Monday breakfast
type SlotKey = `${number}-${MealType}`;

function slotKey(day: number, meal: MealType): SlotKey {
  return `${day}-${meal}`;
}

interface MealPlanEditorProps {
  plan: MealPlan;
  entries: MealPlanEntry[];
  recipes: RecipeSummary[];
  favoriteIds: string[];
}

// ----- Draggable recipe card (in the recipe list) -----
function DraggableRecipe({
  recipe,
  isFavorite,
}: {
  recipe: RecipeSummary;
  isFavorite: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipe },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50 active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {isFavorite && <Heart className="h-3.5 w-3.5 shrink-0 fill-red-500 text-red-500" />}
      <span className="truncate font-medium">{recipe.name}</span>
      <Badge variant="outline" className="ml-auto shrink-0 text-xs">
        {recipe.cuisine_type}
      </Badge>
    </div>
  );
}

// ----- Recipe overlay while dragging -----
function RecipeOverlay({ recipe }: { recipe: RecipeSummary }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium">{recipe.name}</span>
      <Badge variant="outline" className="ml-auto text-xs">
        {recipe.cuisine_type}
      </Badge>
    </div>
  );
}

// ----- Droppable meal slot -----
function MealSlot({
  slotId,
  recipe,
  onRemove,
}: {
  slotId: SlotKey;
  recipe: RecipeSummary | null;
  onRemove: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: slotId });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[3rem] rounded-md border-2 border-dashed p-2 text-sm transition-colors ${
        isOver
          ? "border-primary bg-primary/5"
          : recipe
            ? "border-solid border-muted bg-muted/30"
            : "border-muted-foreground/20"
      }`}
    >
      {recipe ? (
        <div className="flex items-center justify-between gap-1">
          <span className="truncate font-medium">{recipe.name}</span>
          <button
            onClick={onRemove}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Drop recipe here</span>
      )}
    </div>
  );
}

// ----- Main editor -----
export default function MealPlanEditor({
  plan,
  entries,
  recipes,
  favoriteIds,
}: MealPlanEditorProps) {
  const favoriteSet = new Set(favoriteIds);

  // Build initial slot map from entries
  const initialSlots: Record<SlotKey, string> = {};
  for (const entry of entries) {
    initialSlots[slotKey(entry.day_of_week, entry.meal_type)] = entry.recipe_id;
  }

  const [slots, setSlots] = useState<Record<SlotKey, string>>(initialSlots);
  const [activeRecipe, setActiveRecipe] = useState<RecipeSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const recipe = event.active.data.current?.recipe as RecipeSummary | undefined;
      setActiveRecipe(recipe ?? null);
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveRecipe(null);
      const { over, active } = event;

      if (!over) return;

      const recipe = active.data.current?.recipe as RecipeSummary | undefined;
      if (!recipe) return;

      const targetSlot = over.id as SlotKey;
      setSlots((prev) => ({ ...prev, [targetSlot]: recipe.id }));
    },
    []
  );

  const removeSlot = useCallback((key: SlotKey) => {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const entriesToSave = Object.entries(slots).map(([key, recipeId]) => {
      const [dayStr, meal] = key.split("-") as [string, MealType];
      return { day_of_week: parseInt(dayStr), meal_type: meal, recipe_id: recipeId };
    });

    const result = await saveMealPlanEntries(plan.id, entriesToSave);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Meal plan saved!" });
    }

    setSaving(false);
  }

  const filteredRecipes = searchQuery
    ? recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recipes;

  const filledCount = Object.keys(slots).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{plan.name || "Meal Plan"}</h1>
          <p className="text-sm text-muted-foreground">
            Week of{" "}
            {new Date(plan.week_start + "T00:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            {filledCount} / 21 meals planned
          </p>
        </div>
        <div className="flex gap-2">
          <form
            action={async () => {
              await deleteMealPlan(plan.id);
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </form>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save Plan"}
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Weekly grid */}
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2">
              <div />
              {MEAL_TYPES.map((meal) => (
                <div key={meal} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {meal}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {DAYS_OF_WEEK.map((day, dayIndex) => (
              <div key={day} className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2">
                <div className="flex items-center text-sm font-semibold">{day}</div>
                {MEAL_TYPES.map((meal) => {
                  const key = slotKey(dayIndex, meal);
                  const recipeId = slots[key];
                  const recipe = recipeId ? recipeMap.get(recipeId) ?? null : null;
                  return (
                    <MealSlot
                      key={key}
                      slotId={key}
                      recipe={recipe}
                      onRemove={() => removeSlot(key)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Recipe sidebar */}
          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recipes</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-1.5 overflow-y-auto">
              {filteredRecipes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recipes found
                </p>
              ) : (
                filteredRecipes.map((recipe) => (
                  <DraggableRecipe
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favoriteSet.has(recipe.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <DragOverlay>
          {activeRecipe ? <RecipeOverlay recipe={activeRecipe} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
