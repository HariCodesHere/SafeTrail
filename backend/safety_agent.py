import asyncio
import time
from typing import Dict, List, Optional
import os
import json
import random

from models import Location, RiskAssessment, JourneyRequest
from database import Database
from emergency_protocol import EmergencyProtocol

class SafetyAgent:
    def __init__(self, user_id: str, database: Database, emergency_protocol: EmergencyProtocol):
        self.user_id = user_id
        self.db = database
        self.emergency = emergency_protocol
        self.is_monitoring = False
        self.last_location = None
        self.journey_start_time = None
        self.check_in_pending = False
        self.off_route_count = 0
        
        # Default thresholds for demo mode
        self.thresholds = {
            'risk_threshold': 0.7,
            'check_in_interval': 300,
            'off_route_tolerance': 100,
            'emergency_contacts': []
        }
        
        print(f"SafetyAgent initialized for user: {user_id}")
    
    async def monitor_journey(self, journey_request: JourneyRequest):
        """Main monitoring loop for user journey"""
        self.is_monitoring = True
        self.journey_start_time = time.time()
        self.planned_route = journey_request.route
        
        print(f"Starting journey monitoring for user: {self.user_id}")
        
        while self.is_monitoring:
            try:
                # Mock monitoring cycle
                await asyncio.sleep(30)  # Check every 30 seconds
                print(f"Monitoring user {self.user_id}...")
                
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                await asyncio.sleep(10)
    
    async def assess_location_risk(self, location: Location) -> RiskAssessment:
        """Assess risk at given location using mock data"""
        try:
            # Generate mock risk score
            risk_score = random.uniform(0.1, 0.9)
            
            return RiskAssessment(
                location=location,
                risk_score=risk_score,
                ai_analysis=f"Mock AI analysis: Risk level {risk_score:.2f}",
                incidents=[],
                timestamp=time.time()
            )
            
        except Exception as e:
            print(f"Error assessing location risk: {e}")
            return RiskAssessment(
                location=location,
                risk_score=0.5,
                ai_analysis="Error in risk assessment",
                incidents=[],
                timestamp=time.time()
            )
    
    def risk_detected(self, assessment: RiskAssessment) -> bool:
        """Determine if risk level exceeds user's threshold"""
        return assessment.risk_score > self.thresholds['risk_threshold']
    
    async def handle_risk_detection(self, assessment: RiskAssessment, location: Location):
        """Handle detected risk by notifying user"""
        print(f"Risk detected for user {self.user_id}: {assessment.risk_score}")
        
        # Mock notification
        await self.notify_user({
            'type': 'risk_alert',
            'message': f"Risk detected! Risk score: {assessment.risk_score:.2f}",
            'risk_score': assessment.risk_score,
            'reason': assessment.ai_analysis
        })
    
    def check_off_route(self, current_location: Location) -> bool:
        """Mock off-route detection"""
        return False  # Always on route for demo
    
    async def initiate_check_in(self):
        """Send check-in request to user"""
        print(f"Initiating check-in for user {self.user_id}")
        
        await self.notify_user({
            'type': 'check_in_request',
            'message': "Safety check-in: Are you okay?",
            'timeout': 120
        })
    
    async def handle_check_in_response(self, response: dict):
        """Handle user's response to check-in"""
        print(f"Check-in response from user {self.user_id}: {response}")
    
    async def update_location(self, location_data: dict):
        """Update user's current location"""
        self.last_location = Location(
            lat=location_data['lat'],
            lng=location_data['lng'],
            timestamp=time.time()
        )
        print(f"Location updated for user {self.user_id}: {location_data}")
    
    async def notify_user(self, message: dict):
        """Send notification to user (mock implementation)"""
        print(f"Notification to user {self.user_id}: {message}")
        # In real implementation, this would send via WebSocket
    
    async def stop_monitoring(self):
        """Stop journey monitoring"""
        self.is_monitoring = False
        print(f"Stopped monitoring for user: {self.user_id}")
