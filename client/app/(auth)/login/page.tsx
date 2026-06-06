'use client'

import { createClient } from '../../../lib/supabase'

export default function LoginPage() {
  const supabase = createClient()

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <h1 className="text-2xl font-semibold">InterviewAI</h1>
        <p className="text-sm text-gray-600">Luyện phỏng vấn với AI — miễn phí</p>
        <button
          onClick={handleSignIn}
          className="rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Đăng nhập với Google
        </button>
      </div>
    </main>
  )
}
