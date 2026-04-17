import { UtensilsCrossed } from "lucide-react";

export function RecipeImage({
  src,
  alt,
  className = "h-40",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-center bg-muted ${className}`}
    >
      <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
    </div>
  );
}
