import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { PersonalCashFlowPage } from "@/features/admin/pages/personal-cash-flow-page";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminPersonalCashFlowPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  return <PersonalCashFlowPage userId={user.id} userEmail={user.email ?? "Authenticated user"} />;
}
