# SafeTrail 🌐🛡️

**An Agentic AI-Powered Safety Navigation System**  
_Real-time route protection with automatic risk intervention and emergency protocols_

## Live Links

- Frontend: https://safetrail.vercel.app
- Backend API: https://safetrail-dfkn.onrender.com
- Source: https://github.com/HariCodesHere/SafeTrail

## Tech Stack

| Component     | Technology                               |
| ------------- | ---------------------------------------- |
| **Frontend**  | Next.js 14, React Leaflet, OpenStreetMap |
| **Backend**   | Python FastAPI (WebSocket)               |
| **AI Engine** | Google Gemini Pro                        |
| **Real-Time** | WebSockets, Firebase Cloud Messaging     |
| **Maps**      | OpenStreetMap, Leaflet                   |
| **Database**  | Supabase (PostgreSQL)                    |
| **Emergency** | Twilio API, Emergency Services APIs      |

## Agentic Features

✅ **Real-Time Journey Monitoring**  
✅ **Automatic Rerouting on Risk Detection**  
✅ **Proactive User Check-Ins**  
✅ **Emergency Contact Escalation**  
✅ **Crime Prediction AI**

## Agentic Workflow

```mermaid
sequenceDiagram
    participant User
    participant Agent
    participant DataFeeds
    participant Emergency

    User->>Agent: Set destination + preferences
    Agent->>DataFeeds: Subscribe to crime/location
    loop Every 30 seconds
        DataFeeds->>Agent: Push live updates
        alt Risk detected
            Agent->>Agent: Recalculate route
            Agent->>User: Send alert + reason
        end
        alt User unresponsive/off-route
            Agent->>User: Check-in request
            alt No response in 2min
                Agent->>Emergency: Activate protocol
            end
        end
    end
```

## Implementation

### 1. Agent Controller (Python)

```python
class SafetyAgent:
    def __init__(self, user_id):
        self.user = user_id
        self.thresholds = self.load_preferences()

    def monitor_journey(self):
        while journey_active:
            location = get_live_location(self.user)
            incidents = fetch_realtime_incidents(location)

            if self.risk_detected(incidents):
                new_route = self.recalculate_route()
                self.notify_user(f"Rerouted! Reason: {incidents[0].type}")

            if self.check_off_route():
                if not self.verify_user_response():
                    self.activate_emergency_protocol()
```

### WebSocket Protocol (Chat)

- Client → Server (frontend `AgenticChat.tsx`):

```json
{ "type": "chat_message", "message": "<user text>", "context": { "location": {"lat": ..., "lng": ...}, "riskLevel": "low|medium|high", "userId": "..." } }
```

- Server → Client (backend `main.py` / `conversational_interface.py`):

```json
{ "type": "chat_response", "data": "<assistant reply text>" }
```

### 2. Risk Detection System

```python
def risk_detected(location, user_profile):
    # Gemini AI safety analysis
    safety_report = gemini_analyze(location)

    # Combine with real-time data
    risk_score = (0.6 * safety_report['risk_score'] +
                  0.3 * get_crime_density(location) +
                  0.1 * get_lighting_quality(location))

    # Apply profile-based thresholds
    return risk_score > RISK_THRESHOLDS[user_profile]
```

### 3. Emergency Protocol

```python
def activate_emergency_protocol(user_id):
    contacts = db.get_emergency_contacts(user_id)
    location = get_last_location(user_id)

    # Stage 1: Notify trusted contacts
    for contact in contacts:
        send_alert(contact, f"Safety concern: {user_id} at {location}")

    # Stage 2: Contact authorities
    if no_response_after(300):  # 5 minutes
        call_emergency_services(location)
        activate_siren_remotely(user_id)
```

## Setup Guide

### 1. Installation

```bash
# Clone repository
git clone https://github.com/HariCodesHere/SafeTrail.git
cd SafeTrail

# Install dependencies
pnpm install  # Frontend
pip install -r requirements.txt  # Python backend
```

### 2. Configuration

Create `.env.local` (frontend) and `.env` (backend) files as needed:

```
# Google AI API Key for Gemini Pro
GEMINI_API_KEY=your_google_ai_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000  # Frontend → Backend base URL (use your deployed URL in prod)
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Routing (Frontend)
NEXT_PUBLIC_ORS_API_KEY=your_openrouteservice_key
# Optional: Force location during demos/dev (lat,lng)
NEXT_PUBLIC_FORCE_LOCATION=8.5466,76.9048
```

## Authentication

- Users must sign in with Google or email/password (via Firebase) to access the app.

## Deployment Architecture

```mermaid
graph LR
    A[Web/Mobile Client] --> B[Agentic Controller]
    B --> C[Live Crime API]
    B --> D[AI Safety Engine]
    B --> E[Real-Time Alert System]
    E --> F[Twilio SMS]
    E --> G[Firebase Push]
    E --> H[Emergency Services]
```

## Agentic Decision Matrix

| Condition                    | Action                        |
| ---------------------------- | ----------------------------- |
| **Crime reported on route**  | Reroute + notify user         |
| **User deviates from path**  | Check-in request              |
| **No response to check-in**  | Alert trusted contacts        |
| **High-risk location**       | Enable live location sharing  |
| **Emergency button pressed** | Immediate authorities contact |

## Roadmap

- [ ] Phase 1: Core monitoring (Q1 2024)
- [ ] Phase 2: Multi-city crime data (Q2 2024)
- [ ] Phase 3: Predictive risk modeling (Q3 2024)
- [ ] Phase 4: Crowdsourced threat reporting (Q4 2024)


## Contributors

- Harikrishnan Santhosh — https://github.com/HariCodesHere
- Gauri J — https://github.com/GauriCode
- Tejas Premod — https://github.com/TejasPremod
- Keerthana V T — https://github.com/KeerthanaVT
- Bharath M Guptha — https://github.com/0-BMG-0


