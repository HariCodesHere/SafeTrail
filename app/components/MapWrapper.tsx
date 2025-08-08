'use client'
import dynamic from 'next/dynamic'
import { MapComponentProps } from './MapComponent'

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-96 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-600">
    <span className="text-white">Loading map...</span>
  </div>
})

export default function MapWrapper(props: MapComponentProps) {
  return <MapComponent {...props} />
}