import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  cacheLife: {
    // Integration data (src/server/brief.ts): served from cache, refreshed in
    // the background every ~2 min, never older than 1 hour.
    brief: { stale: 60, revalidate: 120, expire: 3600 },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
