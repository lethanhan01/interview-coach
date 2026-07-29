export type SupabaseConfig = {
  url: string
  key: string
  apiBaseUrl: string
}

export function getSupabaseConfig(): SupabaseConfig {
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  if (authEnabled !== 'true' || !url || !key || !apiBaseUrl) {
    throw new Error(
      'Invalid authentication configuration. Set NEXT_PUBLIC_AUTH_ENABLED=true, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY), and NEXT_PUBLIC_API_BASE_URL.',
    )
  }

  return { url, key, apiBaseUrl }
}
