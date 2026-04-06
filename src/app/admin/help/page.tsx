import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { HelpPage } from "@/features/admin/pages/help-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminHelpPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <HelpPage userEmail={user.email ?? "Authenticated user"} />;
}
