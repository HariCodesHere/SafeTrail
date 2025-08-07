from gzip import READ


READ
from supabase import create_client, Client

url = "https://kjxvqgueswwpkenyqhnz.supabase.co"  # ✅ Replace with YOUR project URL
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeHZxZ3Vlc3d3cGtlbnlxaG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDk3MTksImV4cCI6MjA2OTk4NTcxOX0.uG_l1gBc1YGY31LhybKbeXxAeRYDuYaARD6gKrBGOsQ"
supabase: Client = create_client(url, key) # type: ignore




user_data = {
    "id": "a3f1c2b4-1234-4d56-8e9f-abcdef123456",  # new UUID
    "name": "new_user",
    "phone": "+916238369614",
    "emergency_contacts": [
        {"name": "Friend", "phone": "+911234567890"},
        {"name": "Sibling", "phone": "+919999999999"}
    ],
    "risk_threshold": 0.5,
    "check_in_interval": 600,
    "off_route_tolerance": 30,
    "preferences": {"theme": "light", "notifications": False}
}
user_response = supabase.table("user_profiles").insert(user_data).execute()
print("User Profile Response:", user_response)


incident_data = {
    "id": "b7e2c3d4-5678-4abc-9def-123456789abc",  # valid
    "user_id": "a3f1c2b4-1234-4d56-8e9f-abcdef123456",  # valid
    "location_lat": 28.6200,
    "location_lng": 77.2100,
    "risk_score": 0.65,
    "ai_analysis": "Normal movement detected",
    "incidents": [
        {"type": "trip", "severity": "low"}
    ],
    "timestamp": "2025-08-06T12:00:00Z"
}

incident_response = supabase.table("safety_incidents").insert(incident_data).execute()
print("Safety Incident Response:", incident_response)


import os
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    create_client = None
    Client = None
    SUPABASE_AVAILABLE = False
    print("Warning: Supabase not available. Using mock database.")

from typing import Dict, List, Optional
import json
try:
    from models import UserProfile, SafetyIncident, RiskAssessment
except ImportError:
    # Define mock classes if models.py is missing, for development/testing
    class UserProfile:
        pass
    class SafetyIncident:
        pass
    class RiskAssessment:
        pass

class Database:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.client: Optional[Client] = None # type: ignore
    
    async def initialize(self):
        """Initialize Supabase client"""
        try:
            if self.supabase_url and self.supabase_key and SUPABASE_AVAILABLE:
                self.client = create_client(self.supabase_url, self.supabase_key)
                print("Database connection established")
            else:
                print("Warning: Supabase credentials not found or Supabase not available, using mock database")
                self.client = None
        except Exception as e:
            print(f"Database initialization error: {e}")
            self.client = None
    
    async def create_user_profile(self, profile: UserProfile) -> str:
        """Create or update user profile"""
        try:
            if self.client:
                data = {
                    'name': profile.name,
                    'phone': profile.phone,
                    'emergency_contacts': profile.emergency_contacts,
                    'risk_threshold': profile.risk_threshold,
                    'check_in_interval': profile.check_in_interval,
                    'off_route_tolerance': profile.off_route_tolerance,
                    'preferences': profile.preferences or {}
                }
                
                result = self.client.table('user_profiles').upsert(data).execute()
                return result.data[0]['id'] if result.data else "mock_user_id"
            else:
                return "mock_user_id"
        except Exception as e:
            print(f"Error creating user profile: {e}")
            return "mock_user_id"
    
    async def get_user_profile(self, user_id: str) -> Dict:
        """Get user profile by ID"""
        try:
            if self.client:
                result = self.client.table('user_profiles').select('*').eq('id', user_id).execute()
                return result.data[0] if result.data else {}
            else:
                # Mock data for development
                return {
                    'risk_threshold': 0.7,
                    'check_in_interval': 300,
                    'off_route_tolerance': 100,
                    'emergency_contacts': []
                }
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return {}
    
    async def log_safety_incident(self, user_id: str, assessment: RiskAssessment):
        """Log a safety incident"""
        try:
            if self.client:
                data = {
                    'user_id': user_id,
                    'location_lat': assessment.location.lat,
                    'location_lng': assessment.location.lng,
                    'risk_score': assessment.risk_score,
                    'ai_analysis': assessment.ai_analysis,
                    'incidents': assessment.incidents,
                    'timestamp': assessment.timestamp
                }
                
                self.client.table('safety_incidents').insert(data).execute()
            else:
                print(f"Mock: Logged safety incident for user {user_id}")
        except Exception as e:
            print(f"Error logging safety incident: {e}")
    
    async def get_user_journey_history(self, user_id: str) -> List[Dict]:
        """Get user's journey history"""
        try:
            if self.client:
                result = self.client.table('journeys').select('*').eq('user_id', user_id).execute()
                return result.data or []
            else:
                return []
        except Exception as e:
            print(f"Error getting journey history: {e}")
            return []
    
    async def save_journey(self, user_id: str, journey_data: Dict):
        """Save journey data"""
        try:
            if self.client:
                data = {
                    'user_id': user_id,
                    'start_location': journey_data.get('start_location'),
                    'end_location': journey_data.get('end_location'),
                    'route': journey_data.get('route'),
                    'duration': journey_data.get('duration'),
                    'incidents_count': journey_data.get('incidents_count', 0),
                    'completed': journey_data.get('completed', False)
                }
                
                self.client.table('journeys').insert(data).execute()
            else:
                print(f"Mock: Saved journey for user {user_id}")
        except Exception as e:
            print(f"Error saving journey: {e}")
    
    async def get_emergency_contacts(self, user_id: str) -> List[Dict]:
        """Get emergency contacts for user"""
        try:
            profile = await self.get_user_profile(user_id)
            return profile.get('emergency_contacts', [])
        except Exception as e:
            print(f"Error getting emergency contacts: {e}")
            return []

