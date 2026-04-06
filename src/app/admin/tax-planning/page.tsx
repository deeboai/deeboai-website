import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { TaxPlanningPage } from "@/features/admin/pages/tax-planning-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminTaxPlanningPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <TaxPlanningPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
