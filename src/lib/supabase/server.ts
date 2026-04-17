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
          try {
            // Next.js only allows cookie writes inside Server Actions and Route Handlers. During a normal server
            // render we let middleware own session refreshes, so the read-only render path intentionally skips writes.
            cookieStore.set(name, value, options);
          } catch {
            // The middleware refreshes auth cookies before the request reaches the page, so ignoring render-time
            // cookie writes keeps server components compatible with Next.js without dropping auth support.
          }
        });
      },
    },
  });
}
