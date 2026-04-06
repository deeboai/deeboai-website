import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
