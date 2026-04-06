import { AlertTriangle, LockKeyhole } from "lucide-react";

import { signInAction } from "@/app/admin/actions";
import { hasPublicSupabaseEnv } from "@/lib/env";

type AdminLoginCardProps = {
  errorMessage?: string;
};

export function AdminLoginCard({ errorMessage }: AdminLoginCardProps) {
  if (!hasPublicSupabaseEnv) {
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] border border-amber-500/30 bg-card/95 p-8 shadow-2xl shadow-black/20">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Supabase configuration required</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before using the
              admin application. The README includes the full setup steps and optional service-role
              configuration for username-based sign-in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-2xl shadow-black/20">
      <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.35em] text-primary/70">Protected Workspace</p>
      <h1 className="mt-3 text-3xl font-semibold">Sign in to the finance admin</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Use your email/password or a username/password if `SUPABASE_SERVICE_ROLE_KEY` is configured.
      </p>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <form action={signInAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="identifier" className="text-sm font-medium">
            Username or email
          </label>
          <input
            id="identifier"
            name="identifier"
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            placeholder="amadou or amadou@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            placeholder="Your password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
