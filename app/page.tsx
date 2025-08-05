'use client'

import { useState, useEffect } from 'react'
import { Shield, MapPin, Phone, AlertTriangle, Navigation } from 'lucide-react'
import MapComponent from './components/MapComponent'
import SafetyDashboard from './components/SafetyDashboard'
import EmergencyPanel from './components/EmergencyPanel'
import UserProfile from './components/UserProfile'

export default function Home() {
  const [isJourneyActive, setIsJourneyActive] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [userId, setUserId] = useState<string>('demo_user_123')

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to San Francisco for demo
          setCurrentLocation({ lat: 37.7749, lng: -122.4194 })
        }
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">SafeTrail</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                riskLevel === 'low' ? 'bg-success-100 text-success-800' :
                riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-danger-100 text-danger-800'
              }`}>
                Risk: {riskLevel.toUpperCase()}
              </div>
              {isJourneyActive && (
                <div className="flex items-center space-x-2 text-success-600">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Monitoring Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Map Area */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Navigation & Safety Map</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setIsJourneyActive(!isJourneyActive)}
                    className={isJourneyActive ? 'btn-danger' : 'btn-primary'}
                  >
                    {isJourneyActive ? 'Stop Journey' : 'Start Journey'}
                  </button>
                </div>
              </div>
              
              {currentLocation ? (
                <MapComponent 
                  currentLocation={currentLocation}
                  isJourneyActive={isJourneyActive}
                  onLocationUpdate={setCurrentLocation}
                  onRiskUpdate={setRiskLevel}
                />
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety Dashboard */}
            <SafetyDashboard 
              isActive={isJourneyActive}
              riskLevel={riskLevel}
              currentLocation={currentLocation}
            />

            {/* Emergency Panel */}
            <EmergencyPanel userId={userId} />

            {/* User Profile */}
            <UserProfile userId={userId} />
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex justify-center space-x-4">
          <button className="flex items-center space-x-2 btn-danger">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency</span>
          </button>
          <button className="flex items-center space-x-2 btn-primary">
            <Phone className="h-5 w-5" />
            <span>Call Contact</span>
          </button>
          <button className="flex items-center space-x-2 btn-success">
            <Navigation className="h-5 w-5" />
            <span>Safe Route</span>
          </button>
        </div>
      </div>
    </div>
  )
}
