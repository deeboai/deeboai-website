import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { TaxReservesPage } from "@/features/admin/pages/tax-reserves-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminTaxReservesPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <TaxReservesPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
