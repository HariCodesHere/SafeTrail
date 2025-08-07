'use client'

import { useState } from 'react'
import { AlertTriangle, Phone, MessageSquare, Users, Siren } from 'lucide-react'

interface EmergencyPanelProps {
  userId: string
}

export default function EmergencyPanel({ userId }: EmergencyPanelProps) {
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
          location: { lat: 0, lng: 0 }, // Would get actual location
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
      <div className="card border-red-200 bg-red-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
              <Siren className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Emergency Protocol Active
          </h3>
          
          <p className="text-red-700 mb-4">
            Emergency contacts have been notified. Help is on the way.
          </p>
          
          <div className="space-y-2 text-sm text-red-600">
            <p>✓ Emergency contacts alerted</p>
            <p>✓ Location shared with trusted contacts</p>
            <p>✓ Authorities will be contacted in 5 minutes</p>
          </div>
          
          <div className="mt-6 space-y-2">
            <button 
              onClick={() => setIsEmergencyActive(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              I'm Safe - Cancel Emergency
            </button>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">
              Call 911 Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Emergency Panel</h3>
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>

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

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center space-x-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Phone className="h-4 w-4" />
            <span>Call Contact</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>Send SMS</span>
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Emergency services will be contacted automatically if you don't respond to safety check-ins
        </p>
      </div>
    </div>
  )
}
