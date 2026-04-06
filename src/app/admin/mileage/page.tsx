import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { MileagePage } from "@/features/admin/pages/mileage-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminMileagePage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <MileagePage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
