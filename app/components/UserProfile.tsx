'use client'

import { useState, useEffect } from 'react'
import { User, Settings, Phone, Shield, Clock, MapPin } from 'lucide-react'

interface UserProfileProps {
  userId: string
}

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [profile, setProfile] = useState({
    name: 'Demo User',
    phone: '+1-555-0123',
    risk_threshold: 0.7,
    check_in_interval: 300,
    off_route_tolerance: 100,
    emergency_contacts: [
      { name: 'John Doe', phone: '+1-555-0124', relationship: 'Emergency Contact' },
      { name: 'Jane Smith', phone: '+1-555-0125', relationship: 'Family' }
    ] as EmergencyContact[]
  })
  
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...profile
        })
      })
      
      if (response.ok) {
        setIsEditing(false)
        console.log('Profile updated successfully')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const formatInterval = (seconds: number) => {
    return `${Math.floor(seconds / 60)} minutes`
  }

  if (isEditing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
          <Settings className="h-5 w-5 text-gray-600" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Threshold: {(profile.risk_threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={profile.risk_threshold}
              onChange={(e) => setProfile({ ...profile, risk_threshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Sensitivity</span>
              <span>High Sensitivity</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Interval: {formatInterval(profile.check_in_interval)}
            </label>
            <select
              value={profile.check_in_interval}
              onChange={(e) => setProfile({ ...profile, check_in_interval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSaveProfile}
              className="flex-1 btn-primary"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{profile.name}</div>
            <div className="text-sm text-gray-600">{profile.phone}</div>
          </div>
        </div>

        {/* Safety Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Safety Settings</h4>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span className="text-sm">Risk Sensitivity</span>
            </div>
            <span className="text-sm font-medium">{(profile.risk_threshold * 100).toFixed(0)}%</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm">Check-in Interval</span>
            </div>
            <span className="text-sm font-medium">{formatInterval(profile.check_in_interval)}</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm">Route Tolerance</span>
            </div>
            <span className="text-sm font-medium">{profile.off_route_tolerance}m</span>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Emergency Contacts</h4>
          {profile.emergency_contacts.map((contact, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <Phone className="h-4 w-4 text-gray-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">{contact.name}</div>
                <div className="text-xs text-gray-600">{contact.phone}</div>
              </div>
              <span className="text-xs text-gray-500">{contact.relationship}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Journey Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-2 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-600">12</div>
              <div className="text-xs text-green-600">Safe Journeys</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-600">0</div>
              <div className="text-xs text-blue-600">Incidents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
