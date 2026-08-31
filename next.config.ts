import type { NextConfig } from 'next';

/**
 * The API origin is derived from NEXT_PUBLIC_API_URL so a deployed backend
 * on another host still serves avatars through next/image.
 */
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').origin;
  } catch {
    return 'http://localhost:5000';
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary-hosted avatars.
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      // Local-disk fallback served from the API at /uploads.
      {
        protocol: apiOrigin.startsWith('https') ? 'https' : 'http',
        hostname: new URL(apiOrigin).hostname,
        port: new URL(apiOrigin).port || undefined,
        pathname: '/uploads/**',
      },
    ],
  },

  // The floating dev badge overlaps the mobile bottom tab bar.
  devIndicators: false,
};

export default nextConfig;
