import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Meal Planner
        </h1>
        <p className="text-lg text-muted-foreground">
          Discover recipes, plan your meals, and eat better — tailored to your
          taste, budget, and goals.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className={buttonVariants({ size: "lg" })}
          >
            Get started
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
