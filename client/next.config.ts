import type { NextConfig } from 'next'

const requiredConfig = ['NEXT_PUBLIC_API_BASE_URL'] as const

const missing = requiredConfig.filter((name) => !process.env[name])
if (missing.length > 0) {
  throw new Error(
    'Invalid frontend configuration. Set NEXT_PUBLIC_API_BASE_URL.'
  )
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin-dashboard',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/admin-profile',
        destination: '/admin/profile',
        permanent: true,
      },
      {
        source: '/users',
        destination: '/admin/users',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
