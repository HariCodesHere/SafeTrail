'use client'

import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: number
}

interface EmergencyAlert {
  type: 'medical' | 'security' | 'fire' | 'general'
  location: Location
  message: string
  timestamp: Date
}

type AgenticChatProps = {
  userId: string
  location: Location | null
  riskLevel?: 'low' | 'medium' | 'high'
  onEmergency: (alert: EmergencyAlert) => void
}

export default function AgenticChat({ userId, location, riskLevel, onEmergency }: AgenticChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const [connection, setConnection] = useState<{
    status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'mock'
    message?: string
  }>({ status: 'connecting' })

  // Add initial context message
  useEffect(() => {
    if (location) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your AI safety assistant. I can see you're at coordinates ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}. Current risk level is ${riskLevel || 'low'}. How can I help keep you safe today?`
      }])
    }
  }, [location, riskLevel])

  // Connect to WebSocket with fallback to mock responses
  useEffect(() => {
    try {
      setConnection({ status: 'connecting' })
      const ws = new WebSocket(`ws://localhost:8000/ws/agentic/${userId}`)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          // Ignore any websocket payloads that are not chat responses
          if (msg?.type && msg.type !== 'chat_response') {
            return
          }
          let replyText: string | undefined
          // Preferred protocol: { type: 'chat_response', data: <string|object> }
          if (msg?.type === 'chat_response') {
            if (typeof msg.data === 'string') replyText = msg.data
            else if (msg.data?.reply) replyText = msg.data.reply
            else replyText = JSON.stringify(msg.data)
          }
          // Backward-compat: { reply: '...' }
          if (!replyText && msg?.reply) replyText = msg.reply
          // Fallback: stringify
          if (!replyText) replyText = typeof msg === 'string' ? msg : JSON.stringify(msg)

          setMessages((prev) => [...prev, { role: 'assistant', content: replyText! }])
        } catch (e) {
          console.error('Failed to parse WS message:', e)
        }
      }

      ws.onopen = () => {
        console.log('WebSocket connected to backend')
        setConnection({ status: 'connected' })
      }

      ws.onerror = (err) => {
        console.error('WebSocket error - backend not running:', err)
        console.log('Falling back to mock responses for testing')
        setConnection({ status: 'mock', message: 'Using mock responses' })
      }

      ws.onclose = () => {
        setConnection((prev) => prev.status === 'mock' ? prev : { status: 'disconnected' })
      }

      return () => {
        try { ws.close() } catch {}
      }
    } catch (error) {
      console.error('Failed to connect to backend:', error)
      console.log('Using mock responses for testing')
      setConnection({ status: 'mock', message: 'Using mock responses' })
    }
  }, [])

  // Send a message
  const sendMessage = () => {
    if (!input.trim()) return

    const message: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, message])

    // Try WebSocket first, fallback to mock response
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          message: input,
          context: { location, riskLevel, userId },
        })
      )
    } else {
      // Mock response for testing when backend is not available
      setConnection({ status: 'mock', message: 'Using mock responses' })
      setTimeout(() => {
        const mockResponses = [
          `Based on your location at ${location?.lat.toFixed(4)}, ${location?.lng.toFixed(4)}, I can help you with safety guidance.`,
          `Current risk level is ${riskLevel}. I recommend staying alert and following safety protocols.`,
          `I'm analyzing the area around you. Would you like me to suggest a safe route?`,
          `For emergency situations, I can help coordinate with local authorities. Stay safe!`,
          `I'm here to assist with route planning, safety tips, and emergency protocols.`
        ]
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
        setMessages((prev) => [...prev, { role: 'assistant', content: randomResponse }])
      }, 1000)
    }

    setInput('')
  }

  // Handle emergency
  const handleEmergency = async () => {
    if (!location) {
      alert('Location not available for emergency alert')
      return
    }

    const emergencyAlert: EmergencyAlert = {
      type: 'general',
      location,
      message: 'Emergency alert triggered from chat',
      timestamp: new Date()
    }

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          location,
          timestamp: new Date().toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        onEmergency(data)
      } else {
        onEmergency(emergencyAlert)
      }
    } catch (error) {
      console.error('Emergency API error:', error)
      onEmergency(emergencyAlert)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">AI Safety Assistant</h3>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            riskLevel === 'high' ? 'bg-red-900 text-red-300 border border-red-700' :
            riskLevel === 'medium' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
            'bg-green-900 text-green-300 border border-green-700'
          }`}>
            Risk: {riskLevel?.toUpperCase() || 'LOW'}
          </div>
          <div
            className={`px-2 py-1 rounded text-xs font-medium border ${
              connection.status === 'connected' ? 'bg-emerald-900 text-emerald-300 border-emerald-700' :
              connection.status === 'connecting' ? 'bg-blue-900 text-blue-300 border-blue-700' :
              connection.status === 'mock' ? 'bg-purple-900 text-purple-300 border-purple-700' :
              connection.status === 'error' ? 'bg-red-900 text-red-300 border-red-700' :
              'bg-gray-700 text-gray-300 border-gray-600'
            }`}
            title={connection.message}
          >
            {connection.status === 'connected' && 'Connected'}
            {connection.status === 'connecting' && 'Connecting...'}
            {connection.status === 'mock' && 'Mock Mode'}
            {connection.status === 'error' && 'Error'}
            {connection.status === 'disconnected' && 'Disconnected'}
          </div>
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto bg-gray-700 border border-gray-600 p-3 rounded-lg mb-4">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <p>Start a conversation with your AI safety assistant</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 my-2 rounded-lg max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white ml-auto text-right'
                  : 'bg-gray-600 text-gray-100 mr-auto text-left'
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask about safety, routes, or emergency help..."
        />
        <button 
          onClick={sendMessage} 
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          disabled={!input.trim()}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleEmergency}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <span>🚨</span>
        <span>Emergency Alert</span>
      </button>
    </div>
  )
}
