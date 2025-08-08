import { Shield } from 'lucide-react'

export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="h-10 w-10 text-blue-400 animate-pulse" />
          <h1 className="text-3xl font-bold text-white">SafeTrail</h1>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-gray-400 mt-4">Loading your safety dashboard...</p>
      </div>
    </div>
  )
}