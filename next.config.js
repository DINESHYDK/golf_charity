/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Supabase storage images and any external charity images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Stripe webhook needs raw body — handled in route.ts with config export
};

module.exports = nextConfig;