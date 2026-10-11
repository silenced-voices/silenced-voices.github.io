import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only. This exhibition has no server-side
  // data or routes, so exporting it keeps the same experience without a runtime.
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
