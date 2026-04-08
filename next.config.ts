import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Phase 10 — tenant logos live in the Supabase Storage `brand-assets`
    // public bucket. Allow any *.supabase.co host so the same image config
    // works for every per-customer install without per-install editing.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/brand-assets/**',
      },
    ],
  },
};

export default nextConfig;
