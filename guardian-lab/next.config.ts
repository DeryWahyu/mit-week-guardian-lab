import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Native companion libraries are not all discovered by static tracing on Windows.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@img/sharp-*/lib/**/*"],
    "/api/analyze-apk": ["./.tools/jadx/lib/*.jar", "./.tools/jadx/verified.json"],
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // Keep CSS Modules on Next's native pipeline so their scoped class exports survive.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
