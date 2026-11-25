// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLIENT_DIR = path.resolve(__dirname, '../..')

describe('next.config.ts redirects & global scroll behavior regression', () => {
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  afterEach(() => {
    if (originalApiBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl
    }
  })

  it('redirects /admin to /admin/dashboard (307) and preserves permanent legacy admin redirects', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api/v1'
    const { default: nextConfig } = await import('@/next.config')

    expect(nextConfig.redirects).toBeDefined()
    const redirects = await nextConfig.redirects!()

    expect(redirects).toEqual([
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
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
    ])
  })

  it('does not declare smooth scroll-behavior on html in app/globals.css', () => {
    const globalsCss = fs.readFileSync(
      path.join(CLIENT_DIR, 'app/globals.css'),
      'utf8'
    )
    expect(globalsCss).not.toMatch(/scroll-behavior\s*:\s*smooth/i)
  })
})
