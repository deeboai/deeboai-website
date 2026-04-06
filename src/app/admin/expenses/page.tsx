import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { ExpensesPage } from "@/features/admin/pages/expenses-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminExpensesPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <ExpensesPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
