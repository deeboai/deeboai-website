"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";

import { isAdminHostname, toVisibleAdminPath } from "@/lib/admin-routing";

type AdminLinkProps = ComponentProps<typeof Link>;

export function AdminLink({ href, ...props }: AdminLinkProps) {
  const [isSubdomainAdminHost, setIsSubdomainAdminHost] = useState(false);

  useEffect(() => {
    // The visible admin URLs only strip the `/admin` prefix on the dedicated admin hostname.
    setIsSubdomainAdminHost(isAdminHostname(window.location.hostname));
  }, []);

  const resolvedHref = useMemo(() => {
    if (typeof href !== "string" || !isSubdomainAdminHost) {
      return href;
    }

    return toVisibleAdminPath(href);
  }, [href, isSubdomainAdminHost]);

  return <Link href={resolvedHref} {...props} />;
}
