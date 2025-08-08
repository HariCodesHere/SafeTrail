'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY

interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: number
}

export interface MapComponentProps {
  currentLocation?: Location | null
  isJourneyActive: boolean
  onLocationUpdate?: (location: Location) => void
  onRiskUpdate?: (risk: 'low' | 'medium' | 'high') => void
}

const geocodeAddress = async (address: string) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
    const data = await response.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return null
}

const findRoute = async (start: Location, end: Location) => {
  try {
    // Using OpenRouteService API for routing (free tier)
    if (!ORS_API_KEY) {
      throw new Error('Missing NEXT_PUBLIC_ORS_API_KEY')
    }
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`
    )
    
    if (!response.ok) {
      throw new Error('Routing service unavailable')
    }
    
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates
      const routePoints = coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))
      
      // Extract distance and duration
      const summary = data.features[0].properties.summary
      const distance = (summary.distance / 1000).toFixed(1) + ' km'
      const duration = Math.round(summary.duration / 60) + ' min'
      
      return { routePoints, distance, duration }
    }
  } catch (error) {
    console.error('Routing error:', error)
    // Fallback to straight line if routing fails
    return { routePoints: [start, end], distance: 'N/A', duration: 'N/A' }
  }
  return { routePoints: [], distance: '', duration: '' }
}

export default function MapComponent({ 
  currentLocation: propLocation, 
  isJourneyActive = false, 
  onLocationUpdate, 
  onRiskUpdate 
}: MapComponentProps) {
  const [internalLocation, setInternalLocation] = useState<{ lat: number; lng: number } | null>(propLocation || null)
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [startLocation, setStartLocation] = useState<Location | null>(null)
  const [endLocation, setEndLocation] = useState<Location | null>(null)
  const [route, setRoute] = useState<Array<Location>>([])  
  const [riskAreas, setRiskAreas] = useState<Array<{ lat: number; lng: number; risk: 'low' | 'medium' | 'high' }>>([])  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [routeDistance, setRouteDistance] = useState<string>('')
  const [routeDuration, setRouteDuration] = useState<string>('')

  // Custom icon for markers
  const createIcon = () => new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  })

  // Auto-populate start location with current location
  useEffect(() => {
    if (propLocation) {
      const locationString = `${propLocation.lat.toFixed(6)}, ${propLocation.lng.toFixed(6)}`
      setStartInput(locationString)
      setStartLocation(propLocation)
    }
  }, [propLocation])

  const currentLocation = propLocation

  useEffect(() => {
    if (currentLocation) {
      setRiskAreas([
        { lat: currentLocation.lat + 0.01, lng: currentLocation.lng + 0.01, risk: 'high' },
        { lat: currentLocation.lat - 0.005, lng: currentLocation.lng + 0.015, risk: 'medium' },
        { lat: currentLocation.lat + 0.02, lng: currentLocation.lng - 0.01, risk: 'low' },
      ])
    }
  }, [currentLocation])

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      default: return 'green'
    }
  }

  const handleSetLocation = async (input: string, isStart: boolean) => {
    if (!input.trim()) return
    
    setError('')
    setIsLoading(true)
    let loc: Location | null = null
    
    try {
      if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(input.trim())) {
        const [lat, lng] = input.split(',').map(Number)
        loc = { lat, lng }
      } else {
        const result = await geocodeAddress(input)
        if (result) {
          loc = { lat: result.lat, lng: result.lng }
        }
      }

      if (loc) {
        if (isStart) {
          setStartLocation(loc)
          if (endLocation) {
            const { routePoints, distance, duration } = await findRoute(loc, endLocation)
            setRoute(routePoints)
            setRouteDistance(distance)
            setRouteDuration(duration)
          }
        } else {
          setEndLocation(loc)
          if (startLocation) {
            const { routePoints, distance, duration } = await findRoute(startLocation, loc)
            setRoute(routePoints)
            setRouteDistance(distance)
            setRouteDuration(duration)
          }
        }
      } else {
        setError(`${isStart ? 'Start' : 'End'} location not found`)
      }
    } catch (err) {
      setError(`Failed to geocode ${isStart ? 'start' : 'end'} location`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentLocation) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-800 rounded-xl border border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <span className="text-gray-300">Getting your location...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 space-y-4">
      {/* Route Planning Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Route Planning</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">From (Start)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Current location"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetLocation(startInput, true)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-3 text-green-400 text-sm">
                📍
              </div>
            </div>
            <button 
              onClick={() => handleSetLocation(startInput, true)}
              disabled={isLoading || !startInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Setting...' : 'Set Start Location'}
            </button>
          </div>

          {/* End Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">To (Destination)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter destination address"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetLocation(endInput, false)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-3 text-red-400 text-sm">
                🎯
              </div>
            </div>
            <button 
              onClick={() => handleSetLocation(endInput, false)}
              disabled={isLoading || !endInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white p-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Setting...' : 'Set Destination'}
            </button>
          </div>
        </div>

        {/* Route Info */}
        {startLocation && endLocation && route.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Route Information</span>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-400">📏 {routeDistance}</span>
                <span className="text-green-400">⏱️ {routeDuration}</span>
              </div>
            </div>
          </div>
        )}

        {/* Route Actions */}
        {startLocation && endLocation && (
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => {
                setRoute([])
                setStartLocation(null)
                setEndLocation(null)
                setStartInput('')
                setEndInput('')
                setRouteDistance('')
                setRouteDuration('')
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg font-medium transition-colors"
            >
              Clear Route
            </button>
            <button 
              onClick={async () => {
                if (startLocation && endLocation) {
                  setIsLoading(true)
                  const { routePoints, distance, duration } = await findRoute(startLocation, endLocation)
                  setRoute(routePoints)
                  setRouteDistance(distance)
                  setRouteDuration(duration)
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Finding...' : 'Find Safe Route'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Map Container */}
      <MapContainer
        center={startLocation || currentLocation}
        zoom={15}
        className="w-full h-96 rounded-lg border border-gray-600 z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createIcon()} />
        
        {startLocation && (
          <Marker position={[startLocation.lat, startLocation.lng]} icon={createIcon()} />
        )}
        
        {endLocation && (
          <Marker position={[endLocation.lat, endLocation.lng]} icon={createIcon()} />
        )}

        {route.length > 1 && (
          <Polyline 
            positions={route.map(point => [point.lat, point.lng])} 
            color="#3b82f6" 
            weight={5}
            opacity={0.8}
            dashArray="0"
          />
        )}

        {riskAreas.map((area, idx) => (
          <Marker
            key={idx}
            position={[area.lat, area.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="background:${getRiskColor(area.risk)};width:24px;height:24px;border-radius:50%;border:2px solid white;"></div>`
            })}
          />
        ))}
      </MapContainer>
    </div>
  )
}