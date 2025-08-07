from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Location(BaseModel):
    lat: float
    lng: float
    timestamp: Optional[float] = None

class UserProfile(BaseModel):
    user_id: Optional[str] = None
    name: str
    phone: str
    emergency_contacts: List[Dict[str, str]]
    risk_threshold: float = 0.7
    check_in_interval: int = 300  # seconds
    off_route_tolerance: int = 100  # meters
    preferences: Optional[Dict[str, Any]] = {}

class JourneyRequest(BaseModel):
    user_id: str
    start_location: Location
    end_location: Location
    route: List[Dict[str, float]]  # List of lat/lng waypoints
    estimated_duration: Optional[int] = None
    transport_mode: str = "walking"  # walking, driving, cycling

class RiskAssessment(BaseModel):
    location: Location
    risk_score: float
    ai_analysis: str
    incidents: List[Dict[str, Any]]
    timestamp: float

class EmergencyAlert(BaseModel):
    user_id: str
    location: Location
    message: str
    alert_type: str = "manual"  # manual, automatic, check_in_timeout

class SafetyIncident(BaseModel):
    user_id: str
    location: Location
    incident_type: str
    description: str
    risk_score: float
    timestamp: float
    resolved: bool = False

class CheckInRequest(BaseModel):
    user_id: str
    message: str
    timeout_seconds: int = 120

class CheckInResponse(BaseModel):
    user_id: str
    status: str  # safe, help, no_response
    message: Optional[str] = None
    timestamp: float
