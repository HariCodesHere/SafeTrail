'use client'

import { useState, useEffect } from 'react'
import { Shield, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'

interface SafetyDashboardProps {
  isActive: boolean
  riskLevel: 'low' | 'medium' | 'high'
  currentLocation: { lat: number; lng: number } | null
}

export default function SafetyDashboard({ isActive, riskLevel, currentLocation }: SafetyDashboardProps) {
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
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  const handleCheckIn = () => {
    setLastCheckIn(new Date())
    // In real app, this would send check-in to backend
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Safety Dashboard</h3>
        <div className={`p-2 rounded-full ${getRiskColor()}`}>
          <Shield className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Journey Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="font-medium">Journey Status</span>
          </div>
          <span className={`text-sm ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Journey Time */}
        {isActive && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Journey Time</span>
            </div>
            <span className="text-blue-600 font-mono">{formatTime(journeyTime)}</span>
          </div>
        )}

        {/* Current Risk Level */}
        <div className={`p-3 rounded-lg ${getRiskColor()}`}>
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
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <MapPin className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Current Location</span>
            </div>
            <p className="text-sm text-gray-600">
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          </div>
        )}

        {/* Check-in Button */}
        {isActive && (
          <button 
            onClick={handleCheckIn}
            className="w-full btn-success flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>I'm Safe - Check In</span>
          </button>
        )}

        {/* Last Check-in */}
        {lastCheckIn && (
          <div className="text-center text-sm text-gray-500">
            Last check-in: {lastCheckIn.toLocaleTimeString()}
          </div>
        )}

        {/* Recent Incidents */}
        {incidents.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Recent Incidents</h4>
            <div className="space-y-2">
              {incidents.slice(0, 3).map((incident, index) => (
                <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{incident.type}</span>
                    <span className="text-gray-500">{incident.time.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-600">{incident.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
