import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";

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
      <div className={`relative w-full overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
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
