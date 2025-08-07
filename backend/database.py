import os
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError as e:
    create_client = None
    Client = None
    SUPABASE_AVAILABLE = False
    print(f"Warning: Supabase not available due to import error: {e}. Using mock database.")

from typing import Dict, List, Optional
import json
from models import UserProfile, SafetyIncident, RiskAssessment

class Database:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.client: Optional[Client] = None
    
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
