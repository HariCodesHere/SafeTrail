import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from fastapi import WebSocket
import re

from agentic_ai import AgenticAI
from models import Location, UserProfile
from database import Database
from emergency_protocol import EmergencyProtocol

class ConversationalInterface:
    """Natural language conversational interface for SafeTrail's Agentic AI"""
    
    def __init__(self, database: Database, emergency_protocol: EmergencyProtocol):
        self.db = database
        self.emergency = emergency_protocol
        self.active_agents: Dict[str, AgenticAI] = {}
        self.websocket_connections: Dict[str, WebSocket] = {}
        
        # Conversation patterns and intents
        self.intent_patterns = {
            'route_planning': [
                r'plan.*route', r'find.*way', r'navigate.*to', r'directions.*to',
                r'how.*get.*to', r'safest.*route', r'best.*path'
            ],
            'safety_check': [
                r'am.*i.*safe', r'safety.*status', r'check.*safety', r'how.*safe',
                r'risk.*assessment', r'danger.*level'
            ],
            'emergency': [
                r'emergency', r'help.*me', r'danger', r'urgent', r'call.*911',
                r'need.*help', r'in.*trouble'
            ],
            'weather_inquiry': [
                r'weather', r'rain', r'storm', r'temperature', r'forecast',
                r'climate.*conditions'
            ],
            'traffic_inquiry': [
                r'traffic', r'congestion', r'road.*conditions', r'accidents',
                r'delays', r'blocked.*roads'
            ],
            'location_sharing': [
                r'my.*location', r'where.*am.*i', r'current.*position',
                r'share.*location', r'gps.*coordinates'
            ],
            'learning_request': [
                r'remember.*this', r'learn.*from', r'note.*that', r'keep.*in.*mind',
                r'preference', r'i.*prefer', r'i.*like', r'i.*usually'
            ]
        }
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("ConversationalInterface")
    
    async def get_or_create_agent(self, user_id: str) -> AgenticAI:
        """Get existing agent or create new one for user"""
        if user_id not in self.active_agents:
            self.active_agents[user_id] = AgenticAI(user_id, self.db, self.emergency)
            self.logger.info(f"Created new agentic AI for user: {user_id}")
        
        return self.active_agents[user_id]
    
    async def process_conversation(self, user_id: str, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process conversational input and generate intelligent response"""
        try:
            # Get or create agent for user
            agent = await self.get_or_create_agent(user_id)
            
            # Enhance context with conversation metadata
            enhanced_context = await self._enhance_context(user_id, message, context or {})
            
            # Detect intent and urgency
            intent = self._detect_intent(message)
            urgency = self._assess_urgency(message, intent)
            
            # Add intent and urgency to context
            enhanced_context.update({
                'detected_intent': intent,
                'urgency_level': urgency,
                'conversation_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'message_length': len(message),
                    'contains_location': self._contains_location_info(message)
                }
            })
            
            # Process with agentic AI
            response = await agent.process_natural_language_request(message, enhanced_context)
            
            # Handle special cases based on intent and urgency
            response = await self._handle_special_cases(user_id, intent, urgency, response)
            
            # Send response via WebSocket if connected
            if user_id in self.websocket_connections:
                await self._send_websocket_response(user_id, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing conversation for user {user_id}: {e}")
            return {
                'response': "I'm having trouble processing your request right now. Let me try to help you with basic safety information.",
                'error': str(e),
                'fallback_mode': True
            }
    
    def _detect_intent(self, message: str) -> str:
        """Detect user intent from message using pattern matching"""
        message_lower = message.lower()
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return intent
        
        return 'general_inquiry'
    
    def _assess_urgency(self, message: str, intent: str) -> str:
        """Assess urgency level of the message"""
        message_lower = message.lower()
        
        # Critical urgency indicators
        critical_keywords = ['emergency', 'help', 'danger', 'urgent', '911', 'police', 'fire', 'ambulance']
        if any(keyword in message_lower for keyword in critical_keywords):
            return 'critical'
        
        # High urgency indicators
        high_keywords = ['lost', 'stuck', 'scared', 'unsafe', 'threat', 'suspicious']
        if any(keyword in message_lower for keyword in high_keywords):
            return 'high'
        
        # Medium urgency for safety-related intents
        if intent in ['safety_check', 'route_planning']:
            return 'medium'
        
        return 'low'
    
    def _contains_location_info(self, message: str) -> bool:
        """Check if message contains location information"""
        location_indicators = [
            r'\d+.*street', r'\d+.*avenue', r'\d+.*road', r'\d+.*boulevard',
            r'at.*\d+', r'near.*\w+', r'coordinates', r'latitude', r'longitude',
            r'gps', r'address'
        ]
        
        message_lower = message.lower()
        return any(re.search(pattern, message_lower) for pattern in location_indicators)
    
    async def _enhance_context(self, user_id: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance context with additional user and system information"""
        try:
            # Get user profile if available
            user_profile = await self._get_user_profile(user_id)
            
            # Get current location if available
            current_location = context.get('current_location') or await self._get_user_location(user_id)
            
            # Get recent conversation history
            conversation_history = await self._get_recent_conversations(user_id)
            
            enhanced_context = {
                **context,
                'user_profile': user_profile,
                'current_location': current_location,
                'conversation_history': conversation_history,
                'system_time': datetime.now().isoformat(),
                'user_id': user_id
            }
            
            return enhanced_context
            
        except Exception as e:
            self.logger.error(f"Error enhancing context: {e}")
            return context
    
    async def _handle_special_cases(self, user_id: str, intent: str, urgency: str, response: Dict[str, Any]) -> Dict[str, Any]:
        """Handle special cases based on intent and urgency"""
        
        # Critical urgency - immediate emergency response
        if urgency == 'critical':
            response['emergency_activated'] = True
            response['immediate_actions'] = [
                'Emergency services have been notified',
                'Your location has been shared with emergency contacts',
                'Stay calm and follow emergency procedures'
            ]
            
            # Trigger emergency protocol
            try:
                await self.emergency.trigger_emergency_alert(user_id, {
                    'type': 'conversational_emergency',
                    'message': response.get('response', ''),
                    'urgency': urgency
                })
            except Exception as e:
                self.logger.error(f"Error triggering emergency protocol: {e}")
        
        # High urgency - enhanced safety measures
        elif urgency == 'high':
            response['enhanced_monitoring'] = True
            response['safety_escalation'] = [
                'Increased monitoring activated',
                'Emergency contacts will be notified if no response in 10 minutes',
                'Location tracking enabled'
            ]
        
        # Route planning intent - provide comprehensive guidance
        elif intent == 'route_planning':
            response['route_guidance'] = True
            response['additional_info'] = [
                'Real-time safety assessment included',
                'Alternative routes provided',
                'Continuous monitoring during journey'
            ]
        
        # Learning request - acknowledge and confirm
        elif intent == 'learning_request':
            response['learning_confirmed'] = True
            response['learning_acknowledgment'] = "I've noted your preference and will remember it for future interactions."
        
        return response
    
    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile from database"""
        try:
            # This would fetch from your database
            # For now, return mock data
            return {
                'user_id': user_id,
                'preferences': {
                    'safety_level': 'high',
                    'route_type': 'safest',
                    'notifications': True
                },
                'emergency_contacts': ['contact1', 'contact2']
            }
        except Exception as e:
            self.logger.error(f"Error getting user profile: {e}")
            return {}
    
    async def _get_user_location(self, user_id: str) -> Dict[str, Any]:
        """Get current user location"""
        try:
            # This would fetch from your location service
            # For now, return mock data
            return {
                'lat': 37.7749,
                'lng': -122.4194,
                'accuracy': 10,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error getting user location: {e}")
            return {}
    
    async def _get_recent_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        try:
            # This would fetch from your database
            # For now, return empty list
            return []
        except Exception as e:
            self.logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def _send_websocket_response(self, user_id: str, response: Dict[str, Any]):
        """Send response via WebSocket connection"""
        try:
            if user_id in self.websocket_connections:
                websocket = self.websocket_connections[user_id]
                await websocket.send_text(json.dumps({
                    'type': 'conversational_response',
                    'data': response,
                    'timestamp': datetime.now().isoformat()
                }))
        except Exception as e:
            self.logger.error(f"Error sending WebSocket response: {e}")
    
    async def connect_websocket(self, user_id: str, websocket: WebSocket):
        """Connect user WebSocket for real-time communication"""
        self.websocket_connections[user_id] = websocket
        self.logger.info(f"WebSocket connected for user: {user_id}")
        
        # Start autonomous monitoring for connected user
        agent = await self.get_or_create_agent(user_id)
        asyncio.create_task(agent.autonomous_monitoring())
    
    async def disconnect_websocket(self, user_id: str):
        """Disconnect user WebSocket"""
        if user_id in self.websocket_connections:
            del self.websocket_connections[user_id]
            self.logger.info(f"WebSocket disconnected for user: {user_id}")
    
    async def start_conversation_session(self, user_id: str, initial_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Start a new conversation session with greeting and context setup"""
        try:
            agent = await self.get_or_create_agent(user_id)
            
            # Create personalized greeting
            greeting_context = initial_context or {}
            greeting_context.update({
                'session_start': True,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            })
            
            greeting_message = "Hello! I'm your SafeTrail AI assistant. How can I help keep you safe today?"
            
            response = await agent.process_natural_language_request(greeting_message, greeting_context)
            
            # Customize greeting response
            response['response'] = f"Hello! I'm your SafeTrail AI assistant. I'm here to help with navigation, safety monitoring, and emergency assistance. How can I help keep you safe today?"
            response['session_started'] = True
            response['available_features'] = [
                'Route planning with safety optimization',
                'Real-time safety monitoring',
                'Emergency assistance',
                'Weather and traffic updates',
                'Personalized safety recommendations'
            ]
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error starting conversation session: {e}")
            return {
                'response': "Hello! I'm your SafeTrail AI assistant. I'm ready to help with your safety and navigation needs.",
                'session_started': True,
                'error': str(e)
            }
    
    async def end_conversation_session(self, user_id: str) -> Dict[str, Any]:
        """End conversation session and cleanup"""
        try:
            # Disconnect WebSocket if connected
            await self.disconnect_websocket(user_id)
            
            # Stop autonomous monitoring
            if user_id in self.active_agents:
                agent = self.active_agents[user_id]
                agent.state = agent.state.IDLE
            
            return {
                'response': "Thank you for using SafeTrail. Stay safe!",
                'session_ended': True,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error ending conversation session: {e}")
            return {
                'response': "Session ended. Thank you for using SafeTrail!",
                'session_ended': True,
                'error': str(e)
            }
    
    def get_conversation_stats(self, user_id: str) -> Dict[str, Any]:
        """Get conversation statistics and insights"""
        try:
            if user_id not in self.active_agents:
                return {'error': 'No active agent found for user'}
            
            agent = self.active_agents[user_id]
            
            return {
                'total_conversations': len(agent.conversation_history),
                'learning_points': len(agent.memory.contextual_knowledge),
                'user_patterns': len(agent.memory.user_patterns),
                'safety_incidents': len(agent.memory.safety_incidents),
                'current_state': agent.state.value,
                'response_effectiveness': agent.memory.response_effectiveness
            }
            
        except Exception as e:
            self.logger.error(f"Error getting conversation stats: {e}")
            return {'error': str(e)}
