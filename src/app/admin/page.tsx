import { AdminLoginCard } from "@/features/admin/components/admin-login-card";
import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { DashboardPage } from "@/features/admin/pages/dashboard-page";
import { getOptionalUser } from "@/lib/auth";

type AdminPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24%)]" />
        <AdminLoginCard errorMessage={searchParams?.error} />
      </main>
    );
  }

  await ensureAdminWorkspace(user);

  return <DashboardPage userEmail={user.email ?? "Authenticated user"} />;
}
