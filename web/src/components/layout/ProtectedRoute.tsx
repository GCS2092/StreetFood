'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children:      React.ReactNode
  requiredRole?: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuth, user } = useAuthStore()

  useEffect(() => {
    if (!isAuth) {
      router.replace('/auth/login')
      return
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/')
    }
  }, [isAuth, user, requiredRole, router])

  if (!isAuth) return null
  if (requiredRole && user?.role !== requiredRole) return null

  return <>{children}</>
}