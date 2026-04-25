import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// React and Next.js dev server require 'unsafe-eval' for HMR and callstack
// reconstruction. It is safe to include only in development.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.posthog.com https://cdn.jsdelivr.net"
  : "script-src 'self' 'unsafe-inline' https://app.posthog.com https://cdn.jsdelivr.net";

// Next.js HMR uses a localhost WebSocket in dev — must be explicitly allowed.
const connectSrc = isDev
  ? "connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://api.axiom.co https://o*.ingest.sentry.io https://api.inngest.com"
  : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://api.axiom.co https://o*.ingest.sentry.io https://api.inngest.com";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  connectSrc,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
