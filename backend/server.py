from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import base64
async def analyze_sos_with_ai(description: str, images_base64: List[str]) -> tuple:
    """
    Simple fallback analyzer because AI module is removed.
    """
    # RULE BASIC: nếu mô tả có từ nguy hiểm → red
    danger_keywords = ["fire", "cháy", "burn", "accident", "blood", "injured", 
                       "nguy hiểm", "kêu cứu", "khẩn cấp", "tai nạn", "kẹt"]

    desc_lower = description.lower()

    if any(word in desc_lower for word in danger_keywords):
        return "red", "High danger based on keywords"

    return "yellow", "Medium danger (AI disabled)"


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'fallback_secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', '24'))

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class RescueTeamCreate(BaseModel):
    username: str
    password: str
    team_name: str

class RescueTeamLogin(BaseModel):
    username: str
    password: str

class RescueTeam(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    team_name: str
    created_at: str

class SOSSignalCreate(BaseModel):
    latitude: float
    longitude: float
    description: str
    images_base64: List[str] = []  # List of base64 images
    user_selected_level: Optional[str] = "medium"  # red, yellow, green

class SOSSignal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    latitude: float
    longitude: float
    description: str
    images_base64: List[str]
    danger_level: str  # red, yellow, green
    ai_assessment: str
    status: str  # pending, in_progress, completed
    assigned_team_id: Optional[str] = None
    created_at: str
    updated_at: str

class SOSStatusUpdate(BaseModel):
    status: str  # in_progress, completed
    notes: Optional[str] = None

class RescueLocationUpdate(BaseModel):
    signal_id: str
    latitude: float
    longitude: float

class RescueLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    signal_id: str
    team_id: str
    latitude: float
    longitude: float
    timestamp: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_team(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_jwt_token(token)
    team = await db.rescue_teams.find_one({"id": payload.get("team_id")}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=401, detail="Team not found")
    return team

async def analyze_sos_with_ai(description: str, images_base64: List[str]) -> tuple:
    """Analyze SOS signal using OpenAI Vision API"""
    try:
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=f"sos-analysis-{uuid.uuid4()}",
            system_message="You are an emergency assessment AI. Analyze the situation and determine danger level."
        ).with_model("openai", "gpt-4o")

        # Prepare prompt
        prompt = f"""Analyze this emergency situation:

Description: {description}

Based on the description and any images provided, assess:
1. Danger level (high/medium/low)
2. Brief assessment of the situation
3. Recommended immediate actions

Respond in this format:
DANGER_LEVEL: [high/medium/low]
ASSESSMENT: [your assessment]"""

        # Prepare message with images
        file_contents = []
        for img_b64 in images_base64[:3]:  # Limit to 3 images
            file_contents.append(ImageContent(image_base64=img_b64))

        user_message = UserMessage(
            text=prompt,
            file_contents=file_contents if file_contents else None
        )

        # Get AI response
        response = await chat.send_message(user_message)
        
        # Parse response
        danger_level = "medium"  # default
        assessment = response
        
        if "DANGER_LEVEL:" in response:
            lines = response.split("\n")
            for line in lines:
                if "DANGER_LEVEL:" in line:
                    level = line.split(":")[1].strip().lower()
                    if level == "high":
                        danger_level = "red"
                    elif level == "low":
                        danger_level = "green"
                    else:
                        danger_level = "yellow"
                    break
        
        return danger_level, assessment
        
    except Exception as e:
        logging.error(f"AI analysis error: {str(e)}")
        # Fallback to basic analysis
        danger_keywords = ["fire", "blood", "injured", "accident", "trapped", "emergency"]
        desc_lower = description.lower()
        if any(word in desc_lower for word in danger_keywords):
            return "red", "AI analysis unavailable. Flagged as high priority based on keywords."
        return "yellow", "AI analysis unavailable. Marked as medium priority."

# Routes
@api_router.get("/")
async def root():
    return {"message": "SOS Emergency System API"}

# Rescue Team Auth
@api_router.post("/rescue/register")
async def register_rescue_team(team_data: RescueTeamCreate):
    existing = await db.rescue_teams.find_one({"username": team_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    team = {
        "id": str(uuid.uuid4()),
        "username": team_data.username,
        "password_hash": hash_password(team_data.password),
        "team_name": team_data.team_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rescue_teams.insert_one(team)
    
    return {
        "id": team["id"],
        "username": team["username"],
        "team_name": team["team_name"]
    }

@api_router.post("/rescue/login")
async def login_rescue_team(credentials: RescueTeamLogin):
    team = await db.rescue_teams.find_one({"username": credentials.username}, {"_id": 0})
    if not team or not verify_password(credentials.password, team["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token({"team_id": team["id"], "username": team["username"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "team": {
            "id": team["id"],
            "username": team["username"],
            "team_name": team["team_name"]
        }
    }

# SOS Signal Management
@api_router.post("/sos/create", response_model=SOSSignal)
async def create_sos_signal(signal_data: SOSSignalCreate):
    # Analyze with AI
    danger_level, ai_assessment = await analyze_sos_with_ai(
        signal_data.description,
        signal_data.images_base64
    )
    
    signal = {
        "id": str(uuid.uuid4()),
        "latitude": signal_data.latitude,
        "longitude": signal_data.longitude,
        "description": signal_data.description,
        "images_base64": signal_data.images_base64,
        "danger_level": danger_level,
        "ai_assessment": ai_assessment,
        "status": "pending",
        "assigned_team_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sos_signals.insert_one(signal)
    return signal

@api_router.get("/sos/signals", response_model=List[SOSSignal])
async def get_all_sos_signals(
    status: Optional[str] = None,
    danger_level: Optional[str] = None
):
    query = {}
    if status:
        query["status"] = status
    if danger_level:
        query["danger_level"] = danger_level
    
    signals = await db.sos_signals.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return signals

@api_router.get("/sos/signals/{signal_id}", response_model=SOSSignal)
async def get_sos_signal(signal_id: str):
    signal = await db.sos_signals.find_one({"id": signal_id}, {"_id": 0})
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal

@api_router.put("/sos/signals/{signal_id}/status")
async def update_sos_status(
    signal_id: str,
    update_data: SOSStatusUpdate,
    current_team: dict = Depends(get_current_team)
):
    signal = await db.sos_signals.find_one({"id": signal_id}, {"_id": 0})
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    update_fields = {
        "status": update_data.status,
        "assigned_team_id": current_team["id"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if update_data.notes:
        update_fields["rescue_notes"] = update_data.notes
    
    await db.sos_signals.update_one({"id": signal_id}, {"$set": update_fields})
    
    return {"message": "Status updated", "signal_id": signal_id}

# Rescue Location Tracking
@api_router.post("/rescue/location")
async def update_rescue_location(
    location_data: RescueLocationUpdate,
    current_team: dict = Depends(get_current_team)
):
    location = {
        "id": str(uuid.uuid4()),
        "signal_id": location_data.signal_id,
        "team_id": current_team["id"],
        "latitude": location_data.latitude,
        "longitude": location_data.longitude,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rescue_locations.insert_one(location)
    return location

@api_router.get("/rescue/location/{signal_id}", response_model=List[RescueLocation])
async def get_rescue_locations(signal_id: str):
    locations = await db.rescue_locations.find(
        {"signal_id": signal_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    return locations

# Dashboard Stats
@api_router.get("/rescue/dashboard/stats")
async def get_dashboard_stats(current_team: dict = Depends(get_current_team)):
    total_signals = await db.sos_signals.count_documents({})
    red_signals = await db.sos_signals.count_documents({"danger_level": "red"})
    yellow_signals = await db.sos_signals.count_documents({"danger_level": "yellow"})
    green_signals = await db.sos_signals.count_documents({"danger_level": "green"})
    pending_signals = await db.sos_signals.count_documents({"status": "pending"})
    
    return {
        "total_signals": total_signals,
        "red_signals": red_signals,
        "yellow_signals": yellow_signals,
        "green_signals": green_signals,
        "pending_signals": pending_signals
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    # test update