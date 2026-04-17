import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { HousingPage } from "@/features/admin/pages/housing-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminHousingPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <HousingPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
