"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const ACADEMY_TESTIMONIAL_BUCKET = "academy-testimonials";

async function updateTestimonialStatus(testimonialId: string, moderationStatus: "approved" | "rejected") {
  await requireAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_testimonials")
    .update({
      moderation_status: moderationStatus,
      is_published: moderationStatus === "approved",
    })
    .eq("id", testimonialId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/testimonials");
}

export async function approveAcademyTestimonial(formData: FormData) {
  const testimonialId = String(formData.get("testimonial_id") ?? "").trim();

  if (!testimonialId) {
    throw new Error("Missing testimonial id.");
  }

  await updateTestimonialStatus(testimonialId, "approved");
}

export async function rejectAcademyTestimonial(formData: FormData) {
  const testimonialId = String(formData.get("testimonial_id") ?? "").trim();

  if (!testimonialId) {
    throw new Error("Missing testimonial id.");
  }

  await updateTestimonialStatus(testimonialId, "rejected");
}

export async function deleteAcademyTestimonial(formData: FormData) {
  const testimonialId = String(formData.get("testimonial_id") ?? "").trim();

  if (!testimonialId) {
    throw new Error("Missing testimonial id.");
  }

  await requireAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  // Look up the storage path first so the uploaded video can be removed along with the testimonial.
  const { data: existingRow, error: selectError } = await supabase
    .from("academy_testimonials")
    .select("video_path")
    .eq("id", testimonialId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingRow?.video_path) {
    const { error: storageError } = await supabase.storage
      .from(ACADEMY_TESTIMONIAL_BUCKET)
      .remove([existingRow.video_path]);

    if (storageError) {
      throw storageError;
    }
  }

  const { error: deleteError } = await supabase
    .from("academy_testimonials")
    .delete()
    .eq("id", testimonialId);

  if (deleteError) {
    throw deleteError;
  }

  revalidatePath("/admin/testimonials");
}
