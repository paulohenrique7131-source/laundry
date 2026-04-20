import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@laundry/data", "@laundry/domain", "@laundry/theme"],
};

export default nextConfig;
