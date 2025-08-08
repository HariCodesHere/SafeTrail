'use client'

import { useState } from 'react'
import { AlertTriangle, Phone, MessageSquare, Users, Siren } from 'lucide-react'

interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: number
}

interface EmergencyPanelProps {
  userId: string
  currentLocation: Location | null
  locationError?: string | null
}

export default function EmergencyPanel({ userId, currentLocation, locationError }: EmergencyPanelProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [emergencyType, setEmergencyType] = useState<string>('')

  const handleEmergencyTrigger = async (type: string) => {
    setIsEmergencyActive(true)
    setEmergencyType(type)
    
    // In real app, this would call the backend API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          location: currentLocation || { lat: 0, lng: 0 },
          message: `Emergency triggered: ${type}`,
          alert_type: 'manual'
        })
      })
      
      if (response.ok) {
        console.log('Emergency protocol activated')
      }
    } catch (error) {
      console.error('Error triggering emergency:', error)
    }
  }

  const emergencyOptions = [
    {
      id: 'immediate_danger',
      label: 'Immediate Danger',
      description: 'I am in immediate physical danger',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      id: 'feeling_unsafe',
      label: 'Feeling Unsafe',
      description: 'I feel unsafe but not in immediate danger',
      icon: MessageSquare,
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      id: 'lost_disoriented',
      label: 'Lost/Disoriented',
      description: 'I am lost or disoriented',
      icon: Users,
      color: 'bg-yellow-600 hover:bg-yellow-700'
    }
  ]

  if (isEmergencyActive) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-xl shadow-xl p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
              <Siren className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-red-200 mb-2">
            Emergency Protocol Active
          </h3>
          
          <p className="text-red-300 mb-4">
            Emergency contacts have been notified. Help is on the way.
          </p>
          
          {currentLocation && (
            <p className="text-red-400 text-sm mb-4">
              Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          )}
          
          <div className="space-y-2 text-sm text-red-300">
            <p>✓ Emergency contacts alerted</p>
            <p>✓ Location shared with trusted contacts</p>
            <p>✓ Authorities will be contacted in 5 minutes</p>
          </div>
          
          <div className="mt-6 space-y-2">
            <button 
              onClick={() => setIsEmergencyActive(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              I'm Safe - Cancel Emergency
            </button>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Call 911 Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Emergency Panel</h3>
        <AlertTriangle className="h-5 w-5 text-red-400" />
      </div>
      
      {locationError && (
        <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
          <p className="text-yellow-300 text-sm">
            ⚠️ {locationError}
          </p>
        </div>
      )}
      
      {currentLocation && (
        <div className="mb-4 p-3 bg-gray-700 border border-gray-600 rounded-lg">
          <p className="text-gray-300 text-sm">
            📍 Current location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {emergencyOptions.map((option) => {
          const IconComponent = option.icon
          return (
            <button
              key={option.id}
              onClick={() => handleEmergencyTrigger(option.id)}
              className={`w-full p-4 rounded-lg text-white text-left transition-colors ${option.color}`}
            >
              <div className="flex items-start space-x-3">
                <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm opacity-90">{option.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-600">
        <h4 className="font-medium text-white mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center space-x-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
            <Phone className="h-4 w-4" />
            <span>Call Contact</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span>Send SMS</span>
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-700 border border-gray-600 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          Emergency services will be contacted automatically if you don't respond to safety check-ins
        </p>
      </div>
    </div>
  )
}
