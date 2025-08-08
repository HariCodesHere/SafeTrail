import './globals.css'
import { ReactNode } from 'react'
import AuthWrapper from './components/AuthWrapper'

export const metadata = {
  title: 'SafeTrail - AI-Powered Safety Navigation',
  description: 'Your intelligent companion for safe travel with AI assistance and real-time monitoring',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}