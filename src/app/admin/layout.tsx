import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              Admin Panel
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/users"
                className="text-muted-foreground hover:text-foreground"
              >
                Users
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {admin.display_name}
            </span>
            <Link
              href="/profile"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              My Profile
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
