'use client'

import { useState, useEffect } from 'react'
import { Shield, MapPin, Phone, AlertTriangle, Navigation, MessageCircle, Bot } from 'lucide-react'
import MapComponent from './components/MapComponent'
import SafetyDashboard from './components/SafetyDashboard'
import EmergencyPanel from './components/EmergencyPanel'
import UserProfile from './components/UserProfile'
import AgenticChat from './components/AgenticChat'

export default function Home() {
  const [isJourneyActive, setIsJourneyActive] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [userId, setUserId] = useState<string>('demo_user_123')
  const [showAgenticChat, setShowAgenticChat] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'emergency' | 'profile' | 'chat'>('dashboard')

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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">SafeTrail</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                riskLevel === 'low' ? 'bg-green-900 text-green-300 border border-green-700' :
                riskLevel === 'medium' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                'bg-red-900 text-red-300 border border-red-700'
              }`}>
                Risk: {riskLevel.toUpperCase()}
              </div>
              {isJourneyActive && (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Monitoring Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 bg-gray-800 rounded-lg p-1" aria-label="Tabs">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: Shield },
              { id: 'map', name: 'Map', icon: MapPin },
              { id: 'chat', name: 'AI Assistant', icon: Bot },
              { id: 'emergency', name: 'Emergency', icon: AlertTriangle },
              { id: 'profile', name: 'Profile', icon: Navigation }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  } whitespace-nowrap py-3 px-4 rounded-md font-medium text-sm flex items-center space-x-2 transition-all duration-200`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Safety Overview</h2>
                    <button 
                      onClick={() => setIsJourneyActive(!isJourneyActive)}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isJourneyActive 
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      }`}
                    >
                      {isJourneyActive ? 'Stop Journey' : 'Start Journey'}
                    </button>
                  </div>
                  <SafetyDashboard 
                    isActive={isJourneyActive}
                    riskLevel={riskLevel}
                    currentLocation={currentLocation}
                  />
                </div>
              </div>
              <div className="space-y-6">
                <EmergencyPanel userId={userId} />
                <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <Bot className="w-5 h-5" />
                      <span>Chat with AI Assistant</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('map')}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-600"
                    >
                      <MapPin className="w-5 h-5" />
                      <span>View Map</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Navigation & Safety Map</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 border border-gray-600"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Ask AI</span>
                  </button>
                  <button 
                    onClick={() => setIsJourneyActive(!isJourneyActive)}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isJourneyActive 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                    }`}
                  >
                    {isJourneyActive ? 'Stop Journey' : 'Start Journey'}
                  </button>
                </div>
              </div>
              
              {currentLocation ? (
                <div className="rounded-lg overflow-hidden border border-gray-600">
                  <MapComponent 
                    currentLocation={currentLocation}
                    isJourneyActive={isJourneyActive}
                    onLocationUpdate={setCurrentLocation}
                    onRiskUpdate={setRiskLevel}
                  />
                </div>
              ) : (
                <div className="h-96 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
              <div className="lg:col-span-3">
                <AgenticChat 
                  userId={userId}
                  onEmergency={(alert) => {
                    console.log('Emergency triggered from chat:', alert)
                    setActiveTab('emergency')
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">AI Features</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
                      <span className="text-gray-300">Natural language queries</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg"></div>
                      <span className="text-gray-300">Multi-step planning</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg"></div>
                      <span className="text-gray-300">Learning from patterns</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-400 rounded-full shadow-lg"></div>
                      <span className="text-gray-300">Autonomous monitoring</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Try Asking</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p className="hover:text-blue-400 transition-colors cursor-pointer">• "Plan a safe route to downtown"</p>
                    <p className="hover:text-blue-400 transition-colors cursor-pointer">• "What's the current risk level?"</p>
                    <p className="hover:text-blue-400 transition-colors cursor-pointer">• "Check weather conditions"</p>
                    <p className="hover:text-red-400 transition-colors cursor-pointer">• "I feel unsafe, help me"</p>
                    <p className="hover:text-purple-400 transition-colors cursor-pointer">• "Remember I prefer well-lit routes"</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="max-w-2xl mx-auto">
              <EmergencyPanel userId={userId} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <UserProfile userId={userId} />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-2xl p-4 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-center space-x-4">
          <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg">
            <Phone className="h-5 w-5" />
            <span>Call Contact</span>
          </button>
          <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg">
            <Navigation className="h-5 w-5" />
            <span>Safe Route</span>
          </button>
        </div>
      </div>
    </div>
  )
}
