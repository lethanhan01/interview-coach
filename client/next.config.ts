import type { NextConfig } from "next";

const requiredConfig = [
  'NEXT_PUBLIC_AUTH_ENABLED',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
] as const

const missing = requiredConfig.filter((name) => !process.env[name])
const hasSupabaseKey = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'true' || missing.length > 0 || !hasSupabaseKey) {
  throw new Error(
    'Invalid frontend authentication configuration. Set NEXT_PUBLIC_AUTH_ENABLED=true, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY), and NEXT_PUBLIC_API_BASE_URL.',
  )
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
