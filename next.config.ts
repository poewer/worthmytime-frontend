import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // osobny katalog dla testów e2e, żeby build nie nadpisywał .next używanego przez `next dev`
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
