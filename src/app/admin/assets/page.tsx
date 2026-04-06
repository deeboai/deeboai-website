import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { AssetsPage } from "@/features/admin/pages/assets-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminAssetsPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <AssetsPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
