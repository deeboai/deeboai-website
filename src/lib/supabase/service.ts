import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertPublicSupabaseEnv, assertServiceRoleKey, env } from "@/lib/env";
import type { Database } from "@/types/supabase";

export function getSupabaseServiceClient() {
  assertPublicSupabaseEnv();
  assertServiceRoleKey();

  return createClient<Database>(env.publicSupabaseUrl, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
