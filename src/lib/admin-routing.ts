const ADMIN_INTERNAL_PREFIX = "/admin";
const ADMIN_HOSTNAME = "admin.deeboai.com";
const ADMIN_LOCAL_HOSTNAME = "admin.localhost";

const ADMIN_VISIBLE_PATHS = new Set([
  "/",
  "/income",
  "/w2-paychecks",
  "/expenses",
  "/mileage",
  "/tax-planning",
  "/housing",
  "/settings",
  "/help",
]);

function normalizeHostname(hostname: string | null | undefined) {
  return (hostname ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

function normalizePathname(pathname: string) {
  if (!pathname) {
    return "/";
  }

  if (pathname === "/") {
    return pathname;
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function isAdminHostname(hostname: string | null | undefined) {
  const normalizedHostname = normalizeHostname(hostname);

  return normalizedHostname === ADMIN_HOSTNAME || normalizedHostname === ADMIN_LOCAL_HOSTNAME;
}

export function isLocalHostname(hostname: string | null | undefined) {
  const normalizedHostname = normalizeHostname(hostname);

  return normalizedHostname === "localhost" || normalizedHostname === "127.0.0.1";
}

export function toInternalAdminPath(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === ADMIN_INTERNAL_PREFIX || normalizedPathname.startsWith(`${ADMIN_INTERNAL_PREFIX}/`)) {
    return normalizedPathname;
  }

  return normalizedPathname === "/" ? ADMIN_INTERNAL_PREFIX : `${ADMIN_INTERNAL_PREFIX}${normalizedPathname}`;
}

export function toVisibleAdminPath(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === ADMIN_INTERNAL_PREFIX) {
    return "/";
  }

  if (normalizedPathname.startsWith(`${ADMIN_INTERNAL_PREFIX}/`)) {
    return normalizedPathname.slice(ADMIN_INTERNAL_PREFIX.length);
  }

  return normalizedPathname;
}

export function isKnownVisibleAdminPath(pathname: string) {
  return ADMIN_VISIBLE_PATHS.has(normalizePathname(pathname));
}

export function isKnownInternalAdminPath(pathname: string) {
  return isKnownVisibleAdminPath(toVisibleAdminPath(pathname));
}

export function buildAdminHostnameRedirectUrl(url: URL) {
  const redirectUrl = new URL(url.toString());
  redirectUrl.hostname = ADMIN_HOSTNAME;
  redirectUrl.pathname = toVisibleAdminPath(url.pathname);

  if (url.protocol === "http:" && !isLocalHostname(url.hostname)) {
    redirectUrl.protocol = "https:";
  }

  return redirectUrl;
}

export function buildPrimaryHostnameRedirectUrl(url: URL) {
  const redirectUrl = new URL(url.toString());
  redirectUrl.hostname = "deeboai.com";

  if (url.protocol === "http:" && !isLocalHostname(url.hostname)) {
    redirectUrl.protocol = "https:";
  }

  return redirectUrl;
}
