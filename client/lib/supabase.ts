import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './supabase-config'

let client: SupabaseClient | undefined

export function getSupabaseBrowserClient(): SupabaseClient {
  const { url, key } = getSupabaseConfig()
  client ??= createBrowserClient(url, key)
  return client
}
