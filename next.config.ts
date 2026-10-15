import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: { qualities: [60, 75] },
  cacheComponents: true,
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
