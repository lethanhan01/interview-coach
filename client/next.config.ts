import type { NextConfig } from 'next'

const requiredConfig = ['NEXT_PUBLIC_API_BASE_URL'] as const

const missing = requiredConfig.filter((name) => !process.env[name])
if (missing.length > 0) {
  throw new Error(
    'Invalid frontend configuration. Set NEXT_PUBLIC_API_BASE_URL.'
  )
}

const nextConfig: NextConfig = {/* config options here */}

export default nextConfig
