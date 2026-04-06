"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertPublicSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/types/supabase";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  assertPublicSupabaseEnv();

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      env.publicSupabaseUrl,
      env.publicSupabaseAnonKey,
    );
  }

  return browserClient;
}
