'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader, AlertTriangle, CheckCircle } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    safety_priority?: string
    actions?: string[]
    reasoning?: string
    proactive_suggestions?: string[]
  }
}

interface AgenticChatProps {
  userId: string
  onEmergency?: (alert: any) => void
}

export default function AgenticChat({ userId, onEmergency }: AgenticChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [websocket, setWebsocket] = useState<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(`ws://localhost:8000/ws/agentic/${userId}`)
    
    ws.onopen = () => {
      setIsConnected(true)
      console.log('Agentic WebSocket connected')
      
      // Start conversation session
      startConversationSession()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'chat_response') {
        handleAgentResponse(data.data)
      } else if (data.type === 'conversational_response') {
        handleAgentResponse(data.data)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('Agentic WebSocket disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    setWebsocket(ws)

    return () => {
      ws.close()
    }
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startConversationSession = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/agentic/start-session/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        })
      })
      
      const data = await response.json()
      if (data.status === 'session_started' && data.response) {
        addMessage('agent', data.response.response, data.response)
      }
    } catch (error) {
      console.error('Error starting session:', error)
      addMessage('agent', "Hello! I'm your SafeTrail AI assistant. How can I help keep you safe today?")
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    addMessage('user', userMessage)

    try {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        // Send via WebSocket for real-time response
        websocket.send(JSON.stringify({
          type: 'chat_message',
          message: userMessage,
          context: {
            timestamp: new Date().toISOString(),
            location: await getCurrentLocation()
          }
        }))
      } else {
        // Fallback to HTTP API
        const response = await fetch(`http://localhost:8000/api/agentic/chat/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: {
              timestamp: new Date().toISOString(),
              location: await getCurrentLocation()
            }
          })
        })

        const data = await response.json()
        if (data.status === 'success') {
          handleAgentResponse(data.response)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage('agent', "I'm having trouble processing your request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgentResponse = (response: any) => {
    addMessage('agent', response.response, response)
    
    // Handle emergency situations
    if (response.emergency_activated && onEmergency) {
      onEmergency({
        type: 'conversational_emergency',
        message: response.response,
        actions: response.immediate_actions
      })
    }
    
    setIsLoading(false)
  }

  const addMessage = (type: 'user' | 'agent', content: string, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      metadata
    }
    
    setMessages(prev => [...prev, newMessage])
  }

  const getCurrentLocation = (): Promise<any> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            })
          },
          () => resolve(null)
        )
      } else {
        resolve(null)
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getSafetyPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <h3 className="font-semibold">SafeTrail AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'agent' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Agent metadata */}
                  {message.type === 'agent' && message.metadata && (
                    <div className="mt-2 space-y-1">
                      {/* Confidence and Safety Priority */}
                      {(message.metadata.confidence || message.metadata.safety_priority) && (
                        <div className="flex items-center space-x-2 text-xs">
                          {message.metadata.confidence && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Confidence: {Math.round(message.metadata.confidence * 100)}%
                            </span>
                          )}
                          {message.metadata.safety_priority && (
                            <span className={`px-2 py-1 rounded ${getSafetyPriorityColor(message.metadata.safety_priority)}`}>
                              {message.metadata.safety_priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Actions taken */}
                      {message.metadata.actions && message.metadata.actions.length > 0 && (
                        <div className="text-xs">
                          <p className="font-medium text-gray-600">Actions:</p>
                          <ul className="list-disc list-inside text-gray-500">
                            {message.metadata.actions.map((action: string, idx: number) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Proactive suggestions */}
                      {message.metadata.proactive_suggestions && message.metadata.proactive_suggestions.length > 0 && (
                        <div className="text-xs">
                          <p className="font-medium text-blue-600">Suggestions:</p>
                          <ul className="list-disc list-inside text-blue-500">
                            {message.metadata.proactive_suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about safety, routes, or anything else..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Ask me about routes, safety checks, weather, or emergency assistance
        </div>
      </div>
    </div>
  )
}
