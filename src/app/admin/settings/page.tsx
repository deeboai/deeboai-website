import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { SettingsPage } from "@/features/admin/pages/settings-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <SettingsPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
