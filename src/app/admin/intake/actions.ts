"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type ProjectIntakeStatus = "new" | "reviewing" | "quoted" | "won" | "lost";

const VALID_STATUSES: ProjectIntakeStatus[] = ["new", "reviewing", "quoted", "won", "lost"];

async function updateStatus(submissionId: string, status: ProjectIntakeStatus) {
  await requireAdminUser();

  // The generated Supabase types do not yet include this table, so the service client is cast the
  // same way the existing admin moderation actions already do.
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("project_intake_submissions")
    .update({ status })
    .eq("id", submissionId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/intake");
}

export async function setProjectIntakeStatus(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ProjectIntakeStatus;

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid intake status.");
  }

  await updateStatus(submissionId, status);
}

export async function deleteProjectIntakeSubmission(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  await requireAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("project_intake_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/intake");
}
