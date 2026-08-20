"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { signOutAction } from "@/app/admin/actions";
import { AdminLink } from "@/features/admin/components/admin-link";
import { ADMIN_NAVIGATION } from "@/features/admin/config/navigation";
import { isAdminHostname, toVisibleAdminPath } from "@/lib/admin-routing";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  title: string;
  subtitle: string;
  userEmail: string;
  children: React.ReactNode;
};

export function AdminShell({ title, subtitle, userEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSubdomainAdminHost, setIsSubdomainAdminHost] = useState(false);
  const navigationGroups = ADMIN_NAVIGATION.reduce<Record<string, typeof ADMIN_NAVIGATION>>((groups, item) => {
    if (!groups[item.section]) {
      groups[item.section] = [];
    }

    groups[item.section].push(item);

    return groups;
  }, {});

  useEffect(() => {
    // The dedicated admin hostname exposes the admin app at the root so URLs stay clean.
    setIsSubdomainAdminHost(isAdminHostname(window.location.hostname));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_26%)]" />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r border-border/70 bg-card/95 p-6 backdrop-blur-xl transition-transform duration-300 animate-slide-in-left lg:static lg:translate-x-0",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Deebo</p>
              <h1 className="mt-3 text-2xl font-semibold">Finance Admin</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Internal operating system for personal finance and self-employment tracking.
              </p>
            </div>

            <nav className="mt-10 space-y-6">
              {Object.entries(navigationGroups).map(([sectionLabel, items]) => (
                <div key={sectionLabel}>
                  <p className="px-4 text-xs uppercase tracking-[0.28em] text-muted-foreground/80">
                    {sectionLabel}
                  </p>
                  <div className="mt-2 space-y-2">
                    {items.map((item) => {
                      const visibleHref = isSubdomainAdminHost ? toVisibleAdminPath(item.href) : item.href;
                      const active = pathname === visibleHref;

                      return (
                        <AdminLink
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
                            active
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </AdminLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto rounded-3xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Signed in</p>
              <p className="mt-2 truncate text-sm font-medium">{userEmail}</p>
              <form action={signOutAction} className="mt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-border/80 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 animate-fade-in-up">
                <button
                  type="button"
                  className="inline-flex rounded-xl border border-border/70 p-2 text-muted-foreground lg:hidden"
                  onClick={() => setIsMobileOpen((current) => !current)}
                  aria-label="Toggle navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            </div>
          </header>

          {isMobileOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation"
            />
          ) : null}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-fade-in-up">{children}</main>
        </div>
      </div>
    </div>
  );
}
