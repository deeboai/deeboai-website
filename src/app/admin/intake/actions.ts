"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

type AcademyIntakeStatus = "new" | "contacted" | "converted";

async function updateIntakeStatus(submissionId: string, status: AcademyIntakeStatus) {
  await requireAdminUser();

  // The generated Supabase types in this app are not narrow enough for admin updates, so the
  // service client is cast the same way the existing moderation actions already do.
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_intake_submissions")
    .update({ status })
    .eq("id", submissionId);

  if (error) {
    throw error;
  }

  // Revalidate the admin intake page after every status change so the queue stays current.
  revalidatePath("/admin/intake");
}

export async function markAcademyIntakeNew(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  await updateIntakeStatus(submissionId, "new");
}

export async function markAcademyIntakeContacted(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  await updateIntakeStatus(submissionId, "contacted");
}

export async function markAcademyIntakeConverted(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  await updateIntakeStatus(submissionId, "converted");
}

export async function deleteAcademyIntakeSubmission(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  await requireAdminUser();

  // The service-role client needs the same cast used in the existing admin moderation flows.
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_intake_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    throw error;
  }

  // Revalidate after deletion so removed submissions disappear immediately from the dashboard.
  revalidatePath("/admin/intake");
}
