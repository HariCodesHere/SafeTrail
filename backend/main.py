from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import asyncio
import json
from typing import Dict, List, Optional, Any
import os
from dotenv import load_dotenv

from safety_agent import SafetyAgent
from agentic_ai import AgenticAI
from conversational_interface import ConversationalInterface
from models import UserProfile, JourneyRequest, EmergencyAlert
from database import Database
from emergency_protocol import EmergencyProtocol

# Load .env file from parent directory
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(title="SafeTrail API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for new endpoints
class ConversationMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class AgenticRequest(BaseModel):
    user_id: str
    request: str
    context: Optional[Dict[str, Any]] = None

# Global state
active_agents: Dict[str, SafetyAgent] = {}
agentic_agents: Dict[str, AgenticAI] = {}
websocket_connections: Dict[str, WebSocket] = {}
db = Database()
emergency = EmergencyProtocol()
conversational_interface = ConversationalInterface(db, emergency)

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

# New Agentic AI Endpoints

@app.post("/api/agentic/chat/{user_id}")
async def agentic_chat(user_id: str, message: ConversationMessage):
    """Process conversational input with agentic AI"""
    try:
        response = await conversational_interface.process_conversation(
            user_id, message.message, message.context
        )
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agentic/start-session/{user_id}")
async def start_agentic_session(user_id: str, context: Optional[Dict[str, Any]] = None):
    """Start a new agentic conversation session"""
    try:
        response = await conversational_interface.start_conversation_session(user_id, context)
        return {"status": "session_started", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agentic/end-session/{user_id}")
async def end_agentic_session(user_id: str):
    """End agentic conversation session"""
    try:
        response = await conversational_interface.end_conversation_session(user_id)
        return {"status": "session_ended", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agentic/stats/{user_id}")
async def get_agentic_stats(user_id: str):
    """Get conversation statistics and learning insights"""
    try:
        stats = conversational_interface.get_conversation_stats(user_id)
        return {"status": "success", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agentic/autonomous-request")
async def autonomous_agentic_request(request: AgenticRequest):
    """Process autonomous agentic AI request with multi-step planning"""
    try:
        agent = await conversational_interface.get_or_create_agent(request.user_id)
        response = await agent.process_natural_language_request(request.request, request.context)
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/agentic/{user_id}")
async def agentic_websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket connection for agentic AI real-time communication"""
    await websocket.accept()
    
    # Connect to conversational interface
    await conversational_interface.connect_websocket(user_id, websocket)
    
    try:
        while True:
            # Listen for messages from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat_message":
                # Process conversational message
                response = await conversational_interface.process_conversation(
                    user_id, 
                    message_data.get("message", ""),
                    message_data.get("context", {})
                )
                
                # Send response back
                await websocket.send_text(json.dumps({
                    "type": "chat_response",
                    "data": response
                }))
            
            elif message_data.get("type") == "location_update":
                # Handle location updates for agentic monitoring
                if user_id in agentic_agents:
                    # Update agent with new location context
                    context = {"current_location": message_data.get("location")}
                    await agentic_agents[user_id].process_natural_language_request(
                        "Location updated", context
                    )
                    
    except WebSocketDisconnect:
        await conversational_interface.disconnect_websocket(user_id)
        print(f"Agentic WebSocket disconnected for user: {user_id}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_journeys": len(active_agents),
        "agentic_agents": len(conversational_interface.active_agents),
        "websocket_connections": len(websocket_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
