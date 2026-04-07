import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  // Transpile monorepo packages
  transpilePackages: [
    "@ai-system/shared-types",
    "@ai-system/ai-clients",
    "@ai-system/database",
    "@ai-system/shared-ui",
  ],
};

export default nextConfig;
