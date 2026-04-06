import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { IncomePage } from "@/features/admin/pages/income-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminIncomePage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <IncomePage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
