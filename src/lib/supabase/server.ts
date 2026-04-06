import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertPublicSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/types/supabase";

export async function getSupabaseServerClient() {
  assertPublicSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient<Database>(env.publicSupabaseUrl, env.publicSupabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
