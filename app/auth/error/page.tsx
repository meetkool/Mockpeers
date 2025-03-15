'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="text-gray-600">
          {error === 'OAuthCallback' 
            ? 'There was a problem signing in with the selected provider. Please try again.'
            : 'An error occurred during authentication.'}
        </p>
        <a 
          href="/login" 
          className="mt-4 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Return to Login
        </a>
      </div>
    </div>
  )
}