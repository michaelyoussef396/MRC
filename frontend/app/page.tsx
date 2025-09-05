'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-mrc-off-white">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-mrc-deep-navy rounded-lg flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-mrc-pure-white">MRC</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-mrc-deep-navy mx-auto" />
        <p className="mt-4 text-mrc-medium-gray">Loading...</p>
      </div>
    </div>
  )
}