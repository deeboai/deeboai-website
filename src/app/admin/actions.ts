"use server";

import { redirect } from "next/navigation";

import { resolveLoginEmail } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function buildAdminRedirect(errorMessage?: string) {
  if (!errorMessage) {
    return "/admin";
  }

  const params = new URLSearchParams({
    error: errorMessage,
  });

  return `/admin?${params.toString()}`;
}

export async function signInAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!identifier || !password) {
    redirect(buildAdminRedirect("Enter a username or email and a password."));
  }

  try {
    const email = await resolveLoginEmail(identifier);
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(buildAdminRedirect(error.message));
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in with the provided credentials.";
    redirect(buildAdminRedirect(message));
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin");
}
