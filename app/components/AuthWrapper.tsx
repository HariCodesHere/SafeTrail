'use client'

import { ReactNode, useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { app as firebaseApp } from '../firebaseConfig'
import { usePathname, useRouter } from 'next/navigation'
import Loading from './Loading'

interface AuthWrapperProps {
  children: ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth(firebaseApp)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        // If user is authenticated and on login/signup page, redirect to dashboard
        if (pathname === '/login' || pathname === '/signup') {
          router.push('/')
        }
      } else {
        setIsAuthenticated(false)
        // If user is not authenticated and not on login/signup page, redirect to login
        if (pathname !== '/login' && pathname !== '/signup') {
          router.push('/login')
        }
      }
      setAuthChecked(true)
    })
    return () => unsubscribe()
  }, [pathname, router])

  // Show loading while checking authentication
  if (!authChecked) {
    return <Loading />
  }

  // Allow access to login and signup pages without authentication
  if ((pathname === '/login' || pathname === '/signup') && !isAuthenticated) {
    return <>{children}</>
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show loading while redirecting
  return <Loading />
}
