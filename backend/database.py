from supabase import create_client, Client

url = "https://kjxvqgueswwpkenyqhnz.supabase.co"  # ✅ Replace with YOUR project URL
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeHZxZ3Vlc3d3cGtlbnlxaG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDk3MTksImV4cCI6MjA2OTk4NTcxOX0.uG_l1gBc1YGY31LhybKbeXxAeRYDuYaARD6gKrBGOsQ"
supabase: Client = create_client(url, key)




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


