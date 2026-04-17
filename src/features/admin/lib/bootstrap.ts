import "server-only";

import type { User } from "@supabase/supabase-js";

import { DEFAULT_BUSINESSES } from "@/features/admin/config/defaults";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function inferUsername(user: User) {
  const metadataUsername =
    typeof user.user_metadata?.username === "string" ? user.user_metadata.username : null;

  if (metadataUsername) {
    return metadataUsername;
  }

  return user.email ? user.email.split("@")[0] : null;
}

export async function ensureAdminWorkspace(user: User) {
  const supabase = (await getSupabaseServerClient()) as any;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      username: inferUsername(user),
    });
  }

  const { data: existingSettings } = await supabase
    .from("user_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingSettings) {
    await supabase.from("user_settings").insert({
      user_id: user.id,
      default_mileage_rate: 0,
      tutoring_tax_reserve_percent: 30,
      consulting_tax_reserve_percent: 30,
      other_tax_reserve_percent: 25,
    });
  }

  const { count } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count) {
    await supabase.from("businesses").insert(
      DEFAULT_BUSINESSES.map((business) => ({
        user_id: user.id,
        ...business,
      })),
    );
  }
}
