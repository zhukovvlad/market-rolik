import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
