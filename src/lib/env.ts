const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Keeping env access centralized prevents ad hoc process.env reads from leaking into client code.
export const env = {
  publicSupabaseUrl,
  publicSupabaseAnonKey,
  serviceRoleKey,
};

export const hasPublicSupabaseEnv = Boolean(publicSupabaseUrl && publicSupabaseAnonKey);
export const hasServiceRoleKey = Boolean(serviceRoleKey);

export function assertPublicSupabaseEnv() {
  if (!hasPublicSupabaseEnv) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in your environment before using the admin app.",
    );
  }
}

export function assertServiceRoleKey() {
  if (!hasServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your environment to allow username-based sign-in and other server-only admin helpers.",
    );
  }
}
