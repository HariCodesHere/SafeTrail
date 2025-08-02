# SafeRoute Planner 🌐🛡️  
**An Agentic AI-Powered Safety Navigation System**  
*Real-time route protection with automatic risk intervention and emergency protocols*  

## Tech Stack  
| Component | Technology |  
|-----------|------------|  
| **Frontend** | Next.js 14, React Map GL |  
| **Backend** | Python FastAPI, Node.js |  
| **AI Engine** | Google Gemini Pro |  
| **Real-Time** | WebSockets, Firebase Cloud Messaging |  
| **Maps** | Google Maps API, Mapbox |  
| **Database** | Supabase (PostgreSQL) |  
| **Emergency** | Twilio API, Emergency Services APIs |  

## Agentic Features  
✅ **Real-Time Journey Monitoring**  
✅ **Automatic Rerouting on Risk Detection**  
✅ **Proactive User Check-Ins**  
✅ **Emergency Contact Escalation**  
✅ **Crime Prediction AI**  

## Agentic Workflow  
~~~mermaid
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
~~~

## Implementation  

### 1. Agent Controller (Python)  
~~~python
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
~~~

### 2. Risk Detection System  
~~~python
def risk_detected(location, user_profile):
    # Gemini AI safety analysis
    safety_report = gemini_analyze(location)
    
    # Combine with real-time data
    risk_score = (0.6 * safety_report['risk_score'] +
                  0.3 * get_crime_density(location) +
                  0.1 * get_lighting_quality(location))
    
    # Apply profile-based thresholds
    return risk_score > RISK_THRESHOLDS[user_profile]
~~~

### 3. Emergency Protocol  
~~~python
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
~~~

## Setup Guide  

### 1. Installation  
~~~bash
# Clone repository
git clone https://github.com/HariCodesHere/SafeTrail.git
cd SafeTrail

# Install dependencies
pnpm install  # Frontend
pip install -r requirements.txt  # Python backend
~~~

### 2. Configuration  
Create `.env` file:  
~~~
GEMINI_API_KEY=your_google_ai_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
FIREBASE_KEY=your_firebase_credentials.json
~~~

## Deployment Architecture  
~~~mermaid
graph LR
    A[Web/Mobile Client] --> B[Agentic Controller]
    B --> C[Live Crime API]
    B --> D[AI Safety Engine]
    B --> E[Real-Time Alert System]
    E --> F[Twilio SMS]
    E --> G[Firebase Push]
    E --> H[Emergency Services]
~~~

## Agentic Decision Matrix  
| Condition | Action |  
|-----------|--------|  
| **Crime reported on route** | Reroute + notify user |  
| **User deviates from path** | Check-in request |  
| **No response to check-in** | Alert trusted contacts |  
| **High-risk location** | Enable live location sharing |  
| **Emergency button pressed** | Immediate authorities contact |  

## Roadmap  
- [ ] Phase 1: Core monitoring (Q1 2024)  
- [ ] Phase 2: Multi-city crime data (Q2 2024)  
- [ ] Phase 3: Predictive risk modeling (Q3 2024)  
- [ ] Phase 4: Crowdsourced threat reporting (Q4 2024)  
~~~
