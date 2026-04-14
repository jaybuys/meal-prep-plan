"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "../../actions";
import { Button } from "@/components/ui/button";

export default function FavoriteButton({
  recipeId,
  initialFavorited,
}: {
  recipeId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavorite(recipeId);
      if ("favorited" in result && result.favorited !== undefined) {
        setFavorited(result.favorited);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          favorited
            ? "fill-red-500 text-red-500"
            : "fill-none text-muted-foreground"
        }`}
      />
      <span className="text-sm">
        {favorited ? "Saved" : "Save"}
      </span>
    </Button>
  );
}
