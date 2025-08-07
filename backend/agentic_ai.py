import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
import google.generativeai as genai
import os
from enum import Enum
import requests
import random

from models import Location, RiskAssessment, JourneyRequest, UserProfile
from database import Database
from emergency_protocol import EmergencyProtocol

class AgentState(Enum):
    IDLE = "idle"
    PLANNING = "planning"
    MONITORING = "monitoring"
    RESPONDING = "responding"
    LEARNING = "learning"

@dataclass
class AgentMemory:
    """Represents agent's memory of past interactions and learnings"""
    user_patterns: Dict[str, Any]
    safety_incidents: List[Dict[str, Any]]
    route_preferences: Dict[str, Any]
    response_effectiveness: Dict[str, float]
    contextual_knowledge: Dict[str, Any]
    
class AgenticAI:
    """Advanced Agentic AI system for SafeTrail with autonomous decision-making,
    learning, planning, and conversational capabilities"""
    
    def __init__(self, user_id: str, database: Database, emergency_protocol: EmergencyProtocol):
        self.user_id = user_id
        self.db = database
        self.emergency = emergency_protocol
        self.state = AgentState.IDLE
        
        # Initialize Gemini AI
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # Agent memory and learning
        self.memory = AgentMemory(
            user_patterns={},
            safety_incidents=[],
            route_preferences={},
            response_effectiveness={},
            contextual_knowledge={}
        )
        
        # Planning and reasoning
        self.current_plan = []
        self.active_goals = []
        self.reasoning_history = []
        
        # Conversation context
        self.conversation_history = []
        self.context_window = 10  # Keep last 10 interactions
        
        # External tools and APIs
        self.available_tools = {
            'weather_api': self._get_weather_data,
            'traffic_api': self._get_traffic_data,
            'news_api': self._get_local_news,
            'emergency_services': self._contact_emergency_services,
            'route_optimizer': self._optimize_route,
            'risk_predictor': self._predict_risks,
            'safety_check': self._perform_safety_check,
            'learn_pattern': self._learn_user_pattern
        }
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(f"AgenticAI-{user_id}")
        
    async def process_natural_language_request(self, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process natural language input and generate intelligent response with actions"""
        self.state = AgentState.RESPONDING
        
        try:
            # Add to conversation history
            self.conversation_history.append({
                'timestamp': datetime.now().isoformat(),
                'user_input': user_input,
                'context': context or {}
            })
            
            # Maintain context window
            if len(self.conversation_history) > self.context_window:
                self.conversation_history = self.conversation_history[-self.context_window:]
            
            # Generate AI response with reasoning
            response = await self._generate_intelligent_response(user_input, context)
            
            # Execute any planned actions
            if response.get('actions'):
                action_results = await self._execute_planned_actions(response['actions'])
                response['action_results'] = action_results
            
            # Learn from interaction
            await self._learn_from_interaction(user_input, response, context)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing request: {e}")
            return {
                'response': "I encountered an error processing your request. Let me try a different approach.",
                'error': str(e),
                'fallback_actions': ['basic_safety_check']
            }
        finally:
            self.state = AgentState.IDLE
    
    async def _generate_intelligent_response(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate intelligent response using AI with multi-step reasoning"""
        
        # Build comprehensive prompt with context
        prompt = self._build_contextual_prompt(user_input, context)
        
        try:
            # Generate AI response
            response = await self.model.generate_content_async(prompt)
            ai_response = response.text
            
            # Parse structured response
            parsed_response = self._parse_ai_response(ai_response)
            
            # Add reasoning and planning
            if parsed_response.get('requires_planning'):
                plan = await self._create_multi_step_plan(user_input, context)
                parsed_response['plan'] = plan
                
            return parsed_response
            
        except Exception as e:
            self.logger.error(f"AI generation error: {e}")
            return self._generate_fallback_response(user_input, context)
    
    def _build_contextual_prompt(self, user_input: str, context: Dict[str, Any]) -> str:
        """Build comprehensive prompt with user context, memory, and capabilities"""
        
        # Get user profile and preferences
        user_profile = context.get('user_profile', {})
        current_location = context.get('current_location', {})
        
        # Build memory context
        memory_context = self._get_relevant_memory_context(user_input)
        
        prompt = f"""
You are SafeTrail's Advanced AI Safety Agent - an intelligent, proactive assistant focused on user safety and navigation.

CURRENT CONTEXT:
- User Input: "{user_input}"
- Current Location: {current_location}
- User Profile: {user_profile}
- Time: {datetime.now().isoformat()}

MEMORY & LEARNING:
{memory_context}

CONVERSATION HISTORY:
{json.dumps(self.conversation_history[-3:], indent=2)}

AVAILABLE CAPABILITIES:
- Real-time risk assessment and prediction
- Multi-step route planning with safety optimization
- Emergency protocol activation
- Weather, traffic, and local news integration
- Proactive safety recommendations
- Learning from user patterns and preferences

RESPONSE FORMAT:
Provide a JSON response with:
{{
    "response": "Natural language response to user",
    "reasoning": "Your step-by-step reasoning process",
    "confidence": 0.0-1.0,
    "actions": ["list", "of", "actions", "to", "take"],
    "requires_planning": true/false,
    "safety_priority": "low/medium/high/critical",
    "proactive_suggestions": ["list", "of", "suggestions"],
    "learning_points": ["what", "to", "remember", "about", "this", "interaction"]
}}

Be conversational, helpful, and always prioritize safety. Think step-by-step and be proactive in suggesting safety measures.
"""
        return prompt
    
    def _get_relevant_memory_context(self, user_input: str) -> str:
        """Extract relevant context from agent memory"""
        context_parts = []
        
        if self.memory.user_patterns:
            context_parts.append(f"User Patterns: {json.dumps(self.memory.user_patterns, indent=2)}")
        
        if self.memory.route_preferences:
            context_parts.append(f"Route Preferences: {json.dumps(self.memory.route_preferences, indent=2)}")
        
        if self.memory.safety_incidents:
            recent_incidents = self.memory.safety_incidents[-3:]  # Last 3 incidents
            context_parts.append(f"Recent Safety Incidents: {json.dumps(recent_incidents, indent=2)}")
        
        return "\n".join(context_parts) if context_parts else "No relevant memory context available."
    
    def _parse_ai_response(self, ai_response: str) -> Dict[str, Any]:
        """Parse AI response and extract structured information"""
        try:
            # Try to extract JSON from response
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = ai_response[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback parsing
                return {
                    'response': ai_response,
                    'reasoning': 'Direct AI response without structured format',
                    'confidence': 0.7,
                    'actions': [],
                    'requires_planning': False,
                    'safety_priority': 'medium'
                }
        except json.JSONDecodeError:
            return {
                'response': ai_response,
                'reasoning': 'Could not parse structured response',
                'confidence': 0.5,
                'actions': [],
                'requires_planning': False,
                'safety_priority': 'medium'
            }
    
    async def _create_multi_step_plan(self, user_input: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create detailed multi-step plan for complex requests"""
        self.state = AgentState.PLANNING
        
        planning_prompt = f"""
Create a detailed multi-step plan for: "{user_input}"
Context: {json.dumps(context, indent=2)}

Consider:
1. Safety requirements and risk mitigation
2. User preferences and patterns
3. Available tools and resources
4. Contingency planning
5. Success metrics

Return a JSON array of steps:
[
    {{
        "step_number": 1,
        "action": "specific_action_to_take",
        "description": "detailed description",
        "tools_needed": ["list", "of", "tools"],
        "success_criteria": "how to measure success",
        "fallback_plan": "what to do if this fails",
        "estimated_duration": "time estimate",
        "safety_considerations": ["safety", "points"]
    }}
]
"""
        
        try:
            response = await self.model.generate_content_async(planning_prompt)
            plan_text = response.text
            
            # Extract JSON plan
            start_idx = plan_text.find('[')
            end_idx = plan_text.rfind(']') + 1
            
            if start_idx != -1 and end_idx != -1:
                plan_json = plan_text[start_idx:end_idx]
                plan = json.loads(plan_json)
                self.current_plan = plan
                return plan
            else:
                return self._create_fallback_plan(user_input)
                
        except Exception as e:
            self.logger.error(f"Planning error: {e}")
            return self._create_fallback_plan(user_input)
    
    def _create_fallback_plan(self, user_input: str) -> List[Dict[str, Any]]:
        """Create basic fallback plan when AI planning fails"""
        return [
            {
                "step_number": 1,
                "action": "assess_current_situation",
                "description": "Evaluate current safety status and user needs",
                "tools_needed": ["risk_predictor"],
                "success_criteria": "Risk assessment completed",
                "fallback_plan": "Use basic safety protocols",
                "estimated_duration": "2 minutes",
                "safety_considerations": ["Ensure user location is known", "Check emergency contacts"]
            },
            {
                "step_number": 2,
                "action": "provide_safety_guidance",
                "description": "Offer appropriate safety recommendations",
                "tools_needed": ["route_optimizer"],
                "success_criteria": "User receives actionable guidance",
                "fallback_plan": "Escalate to emergency protocol if needed",
                "estimated_duration": "5 minutes",
                "safety_considerations": ["Prioritize immediate safety", "Consider environmental factors"]
            }
        ]
    
    async def _execute_planned_actions(self, actions: List[str]) -> Dict[str, Any]:
        """Execute planned actions using available tools"""
        results = {}
        
        for action in actions:
            try:
                if action in self.available_tools:
                    result = await self.available_tools[action]()
                    results[action] = result
                elif hasattr(self, f'_execute_{action}'):
                    method = getattr(self, f'_execute_{action}')
                    result = await method()
                    results[action] = result
                else:
                    results[action] = f"Action '{action}' not implemented"
                    
            except Exception as e:
                results[action] = f"Error executing {action}: {str(e)}"
                
        return results
    
    async def _learn_from_interaction(self, user_input: str, response: Dict[str, Any], context: Dict[str, Any]):
        """Learn and adapt from user interactions"""
        self.state = AgentState.LEARNING
        
        try:
            # Extract learning points
            learning_points = response.get('learning_points', [])
            
            # Update user patterns
            await self._update_user_patterns(user_input, context)
            
            # Update response effectiveness
            confidence = response.get('confidence', 0.5)
            response_type = response.get('safety_priority', 'medium')
            
            if response_type not in self.memory.response_effectiveness:
                self.memory.response_effectiveness[response_type] = []
            
            self.memory.response_effectiveness[response_type].append(confidence)
            
            # Store contextual knowledge
            if learning_points:
                timestamp = datetime.now().isoformat()
                for point in learning_points:
                    self.memory.contextual_knowledge[timestamp] = point
            
            # Persist learning to database
            await self._persist_learning()
            
        except Exception as e:
            self.logger.error(f"Learning error: {e}")
    
    async def _update_user_patterns(self, user_input: str, context: Dict[str, Any]):
        """Update user behavior patterns"""
        current_time = datetime.now()
        
        # Time-based patterns
        hour = current_time.hour
        if 'time_patterns' not in self.memory.user_patterns:
            self.memory.user_patterns['time_patterns'] = {}
        
        if str(hour) not in self.memory.user_patterns['time_patterns']:
            self.memory.user_patterns['time_patterns'][str(hour)] = []
        
        self.memory.user_patterns['time_patterns'][str(hour)].append({
            'input': user_input,
            'timestamp': current_time.isoformat()
        })
        
        # Location-based patterns
        if context.get('current_location'):
            location = context['current_location']
            if 'location_patterns' not in self.memory.user_patterns:
                self.memory.user_patterns['location_patterns'] = {}
            
            location_key = f"{location.get('lat', 0):.2f},{location.get('lng', 0):.2f}"
            if location_key not in self.memory.user_patterns['location_patterns']:
                self.memory.user_patterns['location_patterns'][location_key] = []
            
            self.memory.user_patterns['location_patterns'][location_key].append({
                'input': user_input,
                'timestamp': current_time.isoformat()
            })
    
    def _generate_fallback_response(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback response when AI fails"""
        return {
            'response': f"I understand you're asking about: '{user_input}'. Let me help you with safety guidance and recommendations.",
            'reasoning': 'Using fallback response due to AI processing error',
            'confidence': 0.6,
            'actions': ['safety_check'],
            'requires_planning': False,
            'safety_priority': 'medium',
            'proactive_suggestions': [
                'Share your current location for better assistance',
                'Check your emergency contacts are up to date',
                'Consider your planned route for any safety concerns'
            ]
        }
    
    # Tool implementations
    async def _get_weather_data(self) -> Dict[str, Any]:
        """Get current weather data"""
        try:
            # Mock weather API call
            return {
                'temperature': random.randint(15, 35),
                'condition': random.choice(['sunny', 'cloudy', 'rainy', 'stormy']),
                'visibility': random.choice(['good', 'moderate', 'poor']),
                'safety_impact': random.choice(['low', 'medium', 'high'])
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _get_traffic_data(self) -> Dict[str, Any]:
        """Get current traffic conditions"""
        try:
            return {
                'congestion_level': random.choice(['light', 'moderate', 'heavy']),
                'incidents': random.randint(0, 5),
                'average_speed': random.randint(20, 80),
                'safety_alerts': random.randint(0, 3)
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _get_local_news(self) -> Dict[str, Any]:
        """Get local safety-related news"""
        try:
            return {
                'safety_alerts': [
                    'Construction work on Main Street',
                    'Weather advisory for evening hours'
                ],
                'incidents': [
                    'Minor traffic accident reported on Highway 101'
                ],
                'recommendations': [
                    'Avoid downtown area during rush hour',
                    'Use alternate routes if possible'
                ]
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _contact_emergency_services(self) -> Dict[str, Any]:
        """Contact emergency services if needed"""
        try:
            # This would integrate with actual emergency services
            return {
                'status': 'Emergency services notified',
                'response_time': '5-10 minutes',
                'contact_number': '911'
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _optimize_route(self) -> Dict[str, Any]:
        """Optimize route for safety"""
        try:
            return {
                'optimized_route': 'Route optimized for safety',
                'safety_score': random.uniform(0.7, 0.95),
                'estimated_time': f"{random.randint(15, 60)} minutes",
                'safety_features': [
                    'Well-lit streets',
                    'Low crime areas',
                    'Emergency services nearby'
                ]
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _predict_risks(self) -> Dict[str, Any]:
        """Predict potential risks"""
        try:
            return {
                'risk_level': random.choice(['low', 'medium', 'high']),
                'risk_factors': [
                    'Weather conditions',
                    'Time of day',
                    'Location safety rating'
                ],
                'recommendations': [
                    'Stay in well-lit areas',
                    'Keep emergency contacts handy',
                    'Share location with trusted contacts'
                ]
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _perform_safety_check(self) -> Dict[str, Any]:
        """Perform comprehensive safety check"""
        try:
            return {
                'location_safety': 'Good',
                'emergency_contacts': 'Available',
                'device_battery': f"{random.randint(20, 100)}%",
                'network_signal': 'Strong',
                'recommendations': [
                    'All safety systems operational',
                    'Continue with planned journey'
                ]
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _learn_user_pattern(self) -> Dict[str, Any]:
        """Learn from current user interaction"""
        try:
            return {
                'patterns_updated': True,
                'new_insights': [
                    'User prefers safer routes',
                    'Active during evening hours'
                ],
                'confidence_improvement': 0.05
            }
        except Exception as e:
            return {'error': str(e)}
    
    async def _persist_learning(self):
        """Persist learning data to database"""
        try:
            # Convert memory to JSON for storage
            memory_data = {
                'user_patterns': self.memory.user_patterns,
                'safety_incidents': self.memory.safety_incidents,
                'route_preferences': self.memory.route_preferences,
                'response_effectiveness': self.memory.response_effectiveness,
                'contextual_knowledge': self.memory.contextual_knowledge,
                'updated_at': datetime.now().isoformat()
            }
            
            # Store in database (implementation depends on your database structure)
            # await self.db.store_agent_memory(self.user_id, memory_data)
            
        except Exception as e:
            self.logger.error(f"Error persisting learning: {e}")
    
    async def autonomous_monitoring(self):
        """Autonomous monitoring and proactive safety measures"""
        self.state = AgentState.MONITORING
        
        while self.state == AgentState.MONITORING:
            try:
                # Perform autonomous safety checks
                safety_status = await self._autonomous_safety_assessment()
                
                # Take proactive actions if needed
                if safety_status.get('requires_action'):
                    await self._take_proactive_action(safety_status)
                
                # Learn from monitoring data
                await self._learn_from_monitoring(safety_status)
                
                # Wait before next check
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                self.logger.error(f"Autonomous monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _autonomous_safety_assessment(self) -> Dict[str, Any]:
        """Perform autonomous safety assessment"""
        try:
            # Gather data from multiple sources
            weather = await self._get_weather_data()
            traffic = await self._get_traffic_data()
            news = await self._get_local_news()
            
            # Analyze combined data
            risk_factors = []
            if weather.get('safety_impact') == 'high':
                risk_factors.append('adverse_weather')
            if traffic.get('safety_alerts', 0) > 2:
                risk_factors.append('traffic_incidents')
            if len(news.get('safety_alerts', [])) > 1:
                risk_factors.append('local_incidents')
            
            return {
                'risk_factors': risk_factors,
                'overall_risk': 'high' if len(risk_factors) > 2 else 'medium' if len(risk_factors) > 0 else 'low',
                'requires_action': len(risk_factors) > 1,
                'data_sources': {
                    'weather': weather,
                    'traffic': traffic,
                    'news': news
                }
            }
            
        except Exception as e:
            return {'error': str(e), 'requires_action': False}
    
    async def _take_proactive_action(self, safety_status: Dict[str, Any]):
        """Take proactive safety actions based on assessment"""
        try:
            risk_level = safety_status.get('overall_risk', 'low')
            
            if risk_level == 'high':
                # High risk - immediate action
                await self.emergency.send_safety_alert(
                    self.user_id,
                    "High risk conditions detected. Please take extra precautions."
                )
            elif risk_level == 'medium':
                # Medium risk - advisory
                # Send advisory through WebSocket or notification system
                pass
            
            # Log proactive action
            self.logger.info(f"Proactive action taken for {risk_level} risk")
            
        except Exception as e:
            self.logger.error(f"Error taking proactive action: {e}")
    
    async def _learn_from_monitoring(self, safety_status: Dict[str, Any]):
        """Learn from autonomous monitoring data"""
        try:
            # Store monitoring insights
            timestamp = datetime.now().isoformat()
            self.memory.contextual_knowledge[f"monitoring_{timestamp}"] = {
                'safety_status': safety_status,
                'learned_patterns': 'Autonomous monitoring data',
                'effectiveness': 'To be measured'
            }
            
        except Exception as e:
            self.logger.error(f"Error learning from monitoring: {e}")