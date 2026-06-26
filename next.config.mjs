import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const academySiteUrl = process.env.ACADEMY_SITE_URL ?? "https://academy.deeboai.com";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' mailto:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://calendar.google.com https://*.google.com",
  "style-src 'self' 'unsafe-inline' https://calendar.google.com https://*.google.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://calendar.google.com https://*.google.com",
  "frame-src 'self' https://calendar.google.com https://*.google.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// Opt-in escape hatch for fast local builds on slow machines: SKIP_BUILD_CHECKS=1 skips
// the (very slow) TypeScript phase of `next build`. CI and production builds leave it unset.
const skipBuildChecks = process.env.SKIP_BUILD_CHECKS === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: skipBuildChecks },
  async redirects() {
    // The main DeeboAI site should hand Academy traffic off to the standalone Academy deployment.
    return [
      {
        source: "/academy",
        destination: academySiteUrl,
        permanent: false,
      },
      {
        source: "/academy/:path*",
        destination: `${academySiteUrl}/:path*`,
        permanent: false,
      },
      {
        // The Deebo Studio product page was retired; send any lingering inbound links to Products.
        source: "/deeboai",
        destination: "/products",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    // Pin Turbopack to this repository because the parent folder also has a lockfile.
    root: __dirname,
  },
  webpack: (config) => {
    // Filesystem cache writes have been flaky in this environment, so the build uses in-memory caching instead.
    config.cache = false;
    return config;
  },
};

export default nextConfig;
