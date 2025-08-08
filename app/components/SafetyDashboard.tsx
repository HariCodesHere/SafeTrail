'use client'

import { useState, useEffect } from 'react'
import { Shield, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'

interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: number
}

interface SafetyDashboardProps {
  isActive: boolean
  riskLevel: 'low' | 'medium' | 'high'
  currentLocation: Location | null
  locationError?: string | null
}

export default function SafetyDashboard({ isActive, riskLevel, currentLocation, locationError }: SafetyDashboardProps) {
  const [journeyTime, setJourneyTime] = useState(0)
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null)
  const [incidents, setIncidents] = useState<Array<{ type: string; time: Date; message: string }>>([])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive) {
      interval = setInterval(() => {
        setJourneyTime(prev => prev + 1)
      }, 1000)
    } else {
      setJourneyTime(0)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high': return 'text-red-300 bg-red-900 border-red-700'
      case 'medium': return 'text-yellow-300 bg-yellow-900 border-yellow-700'
      default: return 'text-green-300 bg-green-900 border-green-700'
    }
  }

  const handleCheckIn = () => {
    setLastCheckIn(new Date())
    // In real app, this would send check-in to backend
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Safety Dashboard</h3>
        <div className={`p-2 rounded-full border ${getRiskColor()}`}>
          <Shield className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Journey Status */}
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="font-medium text-white">Journey Status</span>
          </div>
          <span className={`text-sm ${isActive ? 'text-green-400' : 'text-gray-400'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Journey Time */}
        {isActive && (
          <div className="flex items-center justify-between p-3 bg-blue-900 rounded-lg border border-blue-700">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-white">Journey Time</span>
            </div>
            <span className="text-blue-400 font-mono">{formatTime(journeyTime)}</span>
          </div>
        )}

        {/* Current Risk Level */}
        <div className={`p-3 rounded-lg border ${getRiskColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Risk Level</span>
            </div>
            <span className="font-semibold uppercase">{riskLevel}</span>
          </div>
          {riskLevel === 'high' && (
            <p className="text-sm mt-2">High risk area detected. Consider alternative route.</p>
          )}
          {riskLevel === 'medium' && (
            <p className="text-sm mt-2">Moderate risk. Stay alert and follow safety guidelines.</p>
          )}
          {riskLevel === 'low' && (
            <p className="text-sm mt-2">Safe area. Continue with normal precautions.</p>
          )}
        </div>

        {/* Location Info */}
        {currentLocation && (
          <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-3 mb-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-white">Current Location</span>
            </div>
            <p className="text-sm text-gray-300">
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
            {locationError && (
              <p className="text-sm text-red-400 mt-1">{locationError}</p>
            )}
          </div>
        )}

        {/* Check-in Button */}
        {isActive && (
          <button 
            onClick={handleCheckIn}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>I'm Safe - Check In</span>
          </button>
        )}

        {/* Last Check-in */}
        {lastCheckIn && (
          <div className="text-center text-sm text-gray-400">
            Last check-in: {lastCheckIn.toLocaleTimeString()}
          </div>
        )}

        {/* Recent Incidents */}
        {incidents.length > 0 && (
          <div className="border-t border-gray-600 pt-4">
            <h4 className="font-medium text-white mb-2">Recent Incidents</h4>
            <div className="space-y-2">
              {incidents.slice(0, 3).map((incident, index) => (
                <div key={index} className="text-sm p-2 bg-yellow-900 border border-yellow-700 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium text-yellow-300">{incident.type}</span>
                    <span className="text-yellow-400">{incident.time.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-yellow-200">{incident.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
