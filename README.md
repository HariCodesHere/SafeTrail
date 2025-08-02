# SafeRoute Planner 🌐🚨  
*A smart, AI-powered route planner that prioritizes safety using real-time crime data, user preferences, and machine learning.*  

## Tech Stack  

| Category       | Technology |  
|---------------|------------|  
| **Frontend**  | Next.js 14 (App Router), TailwindCSS, Shadcn/ui |  
| **Backend**   | Python (FastAPI), Node.js (Express) |  
| **Database**  | PostgreSQL (Supabase) |  
| **Maps**      | Google Maps API (Free Tier) / OpenStreetMap (OSM) |  
| **AI**        | Google Gemini, OpenAI (Optional) |  
| **Auth**      | NextAuth.js (OAuth) |  
| **Package Manager** | pnpm |  
| **Deployment** | Vercel (Frontend), Render (Backend) |  

## Features  

✅ **AI-Powered Safety Scoring** – Uses Gemini to analyze crime reports and suggest safer routes  
✅ **Real-Time Alerts** – Integrates with crowdsourced safety data (e.g., SafetiPin)  
✅ **Personalized Routing** – Adjusts recommendations based on user profile (gender, time of day)  
✅ **Multi-Modal Transit** – Supports walking, public transport, and ride-sharing  
✅ **Dark Mode & Accessibility** – Built with TailwindCSS for responsive design  

## Setup Guide  

### 1. Clone the Repository  
~~~bash
git clone https://github.com/yourusername/saferoute-planner.git  
cd saferoute-planner  
~~~  

### 2. Install Dependencies  
~~~bash
pnpm install  # Frontend  
cd backend && pip install -r requirements.txt  # Python Backend  
~~~  

### 3. Configure Environment Variables  
Create `.env` files with the following content:  

**Frontend (Next.js)**:  
~~~
NEXT_PUBLIC_GMAPS_API_KEY=your_key  
NEXT_PUBLIC_SUPABASE_URL=your_url  
NEXT_PUBLIC_SUPABASE_KEY=your_key  
~~~  

**Backend (Python)**:  
~~~
GEMINI_API_KEY=your_key  
DATABASE_URL=postgresql://user:pass@localhost:5432/saferoute  
~~~  

### 4. Run the Project  
**Frontend**:  
~~~bash
pnpm dev  
~~~  

**Backend (Python FastAPI)**:  
~~~bash
uvicorn main:app --reload  
~~~  

## API Integrations  

| Service | Use Case | Free Tier Limit |  
|---------|----------|----------------|  
| Google Maps API | Route data, Geocoding | $200/month |  
| OpenStreetMap (OSM) | Fallback for maps | Free |  
| Google Gemini | Crime risk prediction | Free (rate-limited) |  
| SafetiPin | Crowdsourced safety scores | Request API access |  

## AI Implementation  

### 1. Safety Score Prediction (Python)  
~~~python
from google.generativeai import GenerativeModel  

def get_safety_score(location: str) -> float:  
    model = GenerativeModel("gemini-pro")  
    prompt = f"Rate safety (0-1) of {location} for women at night based on crime data."  
    response = model.generate_content(prompt)  
    return float(response.text)  
~~~  

### 2. Route Optimization Algorithm  
Uses **weighted cost function** (safety vs. distance):  
~~~python
def calculate_optimal_route(start, end, safety_weight=0.7):  
    routes = get_routes_from_gmaps(start, end)  
    best_route = min(routes, key=lambda r: (  
        safety_weight * r.risk + (1 - safety_weight) * r.distance  
    ))  
    return best_route  
~~~  

## Deployment  

1. **Frontend (Vercel)**:  
~~~bash
pnpm build
vercel deploy
~~~  

2. **Backend (Render)**:  
- Link GitHub repository  
- Set environment variables  
- Specify build command: `pip install -r requirements.txt`  
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`  

## Contributing  

1. Fork the repository  
2. Create feature branch:  
~~~bash
git checkout -b feature/new-safety-algorithm
~~~  
3. Commit changes and submit PR  

## License  
MIT © 2024 [Harikrishnan Santhosh & Team]  

## Support  
For assistance, open an issue on [GitHub](https://github.com/HariCodesHere/SafeTrail/issues)  
~~~
