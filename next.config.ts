import type { NextConfig } from "next";

// Security headers applied to every response. They harden the app against
// clickjacking, MIME sniffing, referrer leakage and protocol downgrade, and
// stop the browser from handing camera/mic/location to the page.
const securityHeaders = [
  // Force HTTPS for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // No embedding in other sites' frames (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't let the browser guess content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin (not the full path) when leaving the site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The page asks for none of these device capabilities.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version in a response header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
