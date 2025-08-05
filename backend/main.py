from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
from typing import Dict, List
import os
from dotenv import load_dotenv

from safety_agent import SafetyAgent
from models import UserProfile, JourneyRequest, EmergencyAlert
from database import Database
from emergency_protocol import EmergencyProtocol

load_dotenv()

app = FastAPI(title="SafeTrail API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
active_agents: Dict[str, SafetyAgent] = {}
websocket_connections: Dict[str, WebSocket] = {}
db = Database()
emergency = EmergencyProtocol()

@app.on_event("startup")
async def startup_event():
    await db.initialize()
    print("SafeTrail API started successfully")

@app.get("/")
async def root():
    return {"message": "SafeTrail API is running", "version": "1.0.0"}

@app.post("/api/user/profile")
async def create_user_profile(profile: UserProfile):
    """Create or update user profile with safety preferences"""
    try:
        user_id = await db.create_user_profile(profile)
        return {"user_id": user_id, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/journey/start")
async def start_journey(request: JourneyRequest):
    """Start a monitored journey with safety agent"""
    try:
        user_id = request.user_id
        
        # Create safety agent for this user
        agent = SafetyAgent(user_id, db, emergency)
        active_agents[user_id] = agent
        
        # Start monitoring in background
        asyncio.create_task(agent.monitor_journey(request))
        
        return {
            "status": "journey_started",
            "user_id": user_id,
            "route": request.route,
            "monitoring": True
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/journey/stop/{user_id}")
async def stop_journey(user_id: str):
    """Stop journey monitoring"""
    if user_id in active_agents:
        await active_agents[user_id].stop_monitoring()
        del active_agents[user_id]
        return {"status": "journey_stopped", "user_id": user_id}
    else:
        raise HTTPException(status_code=404, detail="No active journey found")

@app.post("/api/emergency/trigger")
async def trigger_emergency(alert: EmergencyAlert):
    """Manually trigger emergency protocol"""
    try:
        await emergency.activate_emergency_protocol(
            alert.user_id, 
            alert.location, 
            alert.message
        )
        return {"status": "emergency_activated", "user_id": alert.user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket connection for real-time updates"""
    await websocket.accept()
    websocket_connections[user_id] = websocket
    
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "location_update":
                if user_id in active_agents:
                    await active_agents[user_id].update_location(message["location"])
            elif message.get("type") == "check_in_response":
                if user_id in active_agents:
                    await active_agents[user_id].handle_check_in_response(message["response"])
                    
    except WebSocketDisconnect:
        if user_id in websocket_connections:
            del websocket_connections[user_id]
        print(f"WebSocket disconnected for user: {user_id}")

async def send_websocket_message(user_id: str, message: dict):
    """Send message to user via WebSocket"""
    if user_id in websocket_connections:
        try:
            await websocket_connections[user_id].send_text(json.dumps(message))
        except Exception as e:
            print(f"Failed to send WebSocket message to {user_id}: {e}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_journeys": len(active_agents),
        "websocket_connections": len(websocket_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
