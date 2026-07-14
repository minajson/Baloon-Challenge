import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the game is fully client-side, works offline once built,
  // and deploys to Netlify/Vercel (or any static host) without a server.
  output: "export",
  // Pin the workspace root (silences the multi-lockfile inference warning).
  turbopack: { root: __dirname },
  images: {
    unoptimized: true,
  },
  // Keep the dev overlay off — the game is projected fullscreen during
  // rehearsals and the indicator badge distracts on the big screen.
  devIndicators: false,
};

export default nextConfig;
