import "server-only";

import { redirect } from "next/navigation";

import { hasServiceRoleKey } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function getOptionalUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdminUser() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/admin");
  }

  return user;
}

// Username lookups are handled server-side so the browser never needs elevated credentials.
export async function resolveLoginEmail(identifier: string) {
  if (identifier.includes("@")) {
    return identifier;
  }

  if (!hasServiceRoleKey) {
    throw new Error(
      "Username sign-in requires SUPABASE_SERVICE_ROLE_KEY. Use an email address or add the server key.",
    );
  }

  const serviceClient = getSupabaseServiceClient() as any;
  const { data, error } = await serviceClient
    .from("profiles")
    .select("email")
    .ilike("username", identifier)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.email) {
    throw new Error("No profile was found for that username.");
  }

  return data.email;
}
