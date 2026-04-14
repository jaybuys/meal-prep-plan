import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                View, edit, and manage user accounts and roles
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
