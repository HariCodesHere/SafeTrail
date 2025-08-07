'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertTriangle, Shield, Navigation, Zap, Eye } from 'lucide-react'

interface MapComponentProps {
  currentLocation: { lat: number; lng: number }
  isJourneyActive: boolean
  onLocationUpdate: (location: { lat: number; lng: number }) => void
  onRiskUpdate: (risk: 'low' | 'medium' | 'high') => void
}

export default function MapComponent({ 
  currentLocation, 
  isJourneyActive, 
  onLocationUpdate, 
  onRiskUpdate 
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null)
  const [route, setRoute] = useState<Array<{ lat: number; lng: number }>>([])
  const [riskAreas, setRiskAreas] = useState<Array<{ lat: number; lng: number; risk: string }>>([])

  // Mock risk areas for demo
  useEffect(() => {
    setRiskAreas([
      { lat: currentLocation.lat + 0.01, lng: currentLocation.lng + 0.01, risk: 'high' },
      { lat: currentLocation.lat - 0.005, lng: currentLocation.lng + 0.015, risk: 'medium' },
      { lat: currentLocation.lat + 0.02, lng: currentLocation.lng - 0.01, risk: 'medium' },
    ])
  }, [currentLocation])

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isJourneyActive) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Convert click position to lat/lng (simplified calculation)
    const lat = currentLocation.lat + (y - rect.height / 2) * -0.0001
    const lng = currentLocation.lng + (x - rect.width / 2) * 0.0001
    
    setDestination({ lat, lng })
    
    // Generate mock route
    const mockRoute = [
      currentLocation,
      { lat: currentLocation.lat + (lat - currentLocation.lat) * 0.3, lng: currentLocation.lng + (lng - currentLocation.lng) * 0.3 },
      { lat: currentLocation.lat + (lat - currentLocation.lat) * 0.7, lng: currentLocation.lng + (lng - currentLocation.lng) * 0.7 },
      { lat, lng }
    ]
    setRoute(mockRoute)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500 border-red-400'
      case 'medium': return 'bg-yellow-500 border-yellow-400'
      default: return 'bg-green-500 border-green-400'
    }
  }

  const getRiskGlow = (risk: string) => {
    switch (risk) {
      case 'high': return 'shadow-red-500/50'
      case 'medium': return 'shadow-yellow-500/50'
      default: return 'shadow-green-500/50'
    }
  }

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg border border-gray-600 transition-all duration-200">
          <Navigation className="w-4 h-4" />
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg border border-gray-600 transition-all duration-200">
          <Eye className="w-4 h-4" />
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg border border-gray-600 transition-all duration-200">
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Map Status Indicator */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-gray-600">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isJourneyActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm font-medium">
              {isJourneyActive ? 'Live Tracking' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      <div 
        ref={mapRef}
        className="w-full h-96 bg-gray-900 rounded-lg border border-gray-600 cursor-crosshair relative overflow-hidden shadow-2xl"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {/* Current Location */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: '50%',
            top: '50%'
          }}
        >
          <div className="relative">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-xl"></div>
            <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -inset-2 w-9 h-9 border-2 border-blue-400 rounded-full opacity-30 animate-pulse"></div>
          </div>
        </div>

        {/* Risk Areas */}
        {riskAreas.map((area, index) => {
          const x = 50 + (area.lng - currentLocation.lng) * 10000
          const y = 50 + (area.lat - currentLocation.lat) * -10000
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${Math.max(0, Math.min(100, x))}%`,
                top: `${Math.max(0, Math.min(100, y))}%`
              }}
            >
              <div className={`w-10 h-10 ${getRiskColor(area.risk)} rounded-full border-2 shadow-lg ${getRiskGlow(area.risk)} flex items-center justify-center animate-pulse`}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className={`absolute inset-0 w-10 h-10 ${getRiskColor(area.risk)} rounded-full opacity-20 animate-ping`}></div>
            </div>
          )
        })}

        {/* Destination */}
        {destination && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${50 + (destination.lng - currentLocation.lng) * 10000}%`,
              top: `${50 + (destination.lat - currentLocation.lat) * -10000}%`
            }}
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-red-400 drop-shadow-lg" />
              <div className="absolute -inset-1 w-10 h-10 border-2 border-red-400 rounded-full opacity-50 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Route Line */}
        {route.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <polyline
              points={route.map(point => {
                const x = 50 + (point.lng - currentLocation.lng) * 10000
                const y = 50 + (point.lat - currentLocation.lat) * -10000
                return `${x}%,${y}%`
              }).join(' ')}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="8,4"
              className="animate-pulse drop-shadow-lg"
            />
          </svg>
        )}

        {/* Instructions Overlay */}
        {!isJourneyActive && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-white p-8 bg-gray-800 bg-opacity-50 rounded-xl border border-gray-600">
              <Shield className="w-16 h-16 mx-auto mb-6 text-blue-400" />
              <p className="text-xl font-semibold mb-3">Start Journey to Enable Map</p>
              <p className="text-sm text-gray-300">Click "Start Journey" to begin real-time safety monitoring</p>
            </div>
          </div>
        )}

        {isJourneyActive && !destination && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600">
            <p className="text-sm font-medium">💡 Click anywhere on the map to set your destination</p>
          </div>
        )}
      </div>



      {/* Legend */}
      <div className="mt-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-3">Map Legend</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            <span className="text-gray-300">Your Location</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full border border-red-400 shadow-lg"></div>
            <span className="text-gray-300">High Risk</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border border-yellow-400 shadow-lg"></div>
            <span className="text-gray-300">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full border border-green-400 shadow-lg"></div>
            <span className="text-gray-300">Safe Area</span>
          </div>
        </div>
        {route.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 rounded-full"></div>
              <span className="text-gray-300">Planned Route</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
