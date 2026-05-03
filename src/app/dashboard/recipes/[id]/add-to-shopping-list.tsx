"use client";

import { useState, useTransition } from "react";
import { addIngredientsToShoppingList } from "@/app/dashboard/shopping-list/actions";
import type { Ingredient } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";

export function AddIngredientButton({ ingredient }: { ingredient: Ingredient }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await addIngredientsToShoppingList([
        { name: ingredient.name, quantity: ingredient.quantity || null, unit: ingredient.unit || undefined },
      ]);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || added}
      className="inline-flex shrink-0 items-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      title="Add to shopping list"
    >
      {added ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <ShoppingCart className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function AddAllIngredientsButton({ ingredients }: { ingredients: Ingredient[] }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await addIngredientsToShoppingList(
        ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity || null,
          unit: ing.unit || undefined,
        }))
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending || added}
    >
      {added ? (
        <>
          <Check className="mr-1.5 h-4 w-4 text-green-600" />
          Added to shopping list
        </>
      ) : (
        <>
          <ShoppingCart className="mr-1.5 h-4 w-4" />
          {isPending ? "Adding..." : "Add all ingredients to shopping list"}
        </>
      )}
    </Button>
  );
}
