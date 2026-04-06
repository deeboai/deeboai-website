import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { W2PaychecksPage } from "@/features/admin/pages/w2-paychecks-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminW2PaychecksPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <W2PaychecksPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
