# pyrefly: ignore [missing-import]
import socket
# Force IPv4 getaddrinfo resolution to bypass Windows IPv6 timeout bugs
orig_getaddrinfo = socket.getaddrinfo
DNS_MAP = {
    "www.googleapis.com": "172.217.170.170",
    "oauth2.googleapis.com": "172.217.170.170",
    "accounts.google.com": "172.217.170.174",
}
def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host in DNS_MAP:
        host = DNS_MAP[host]
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = patched_getaddrinfo

from google import genai
import os
# pyrefly: ignore [missing-import]
import joblib
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, status, Request
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from prisma import Prisma
# pyrefly: ignore [missing-import]
from slowapi import Limiter
# pyrefly: ignore [missing-import]
from slowapi.util import get_remote_address
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from google.oauth2 import id_token
# pyrefly: ignore [missing-import]
from google.auth.transport import requests as google_requests

# Local security utilities
from security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, verify_token
)

load_dotenv()

# --- RATE LIMITING SETUP ---
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Nuclear AI - Technical Knowledge Hub v2.5")
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )

# --- SECURITY SETTINGS (CORS) ---
origins = [
    "https://nuclearaiphase1.netlify.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
db = Prisma()

@app.on_event("startup")
async def startup():
    try:
        await db.connect()
        print("Successfully connected to the database.")
    except Exception as e:
        print(f"⚠️ DATABASE CONNECTION WARNING: {e}")


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

# --- ML & AI SETUP ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    print("⚠️ WARNING: GEMINI_API_KEY environment variable is not set. AI assistant endpoints will be disabled.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'model.pkl')
try:
    model = joblib.load(model_path)
except Exception:
    model = None

# --- MODELS ---
class AdvancedReactorData(BaseModel):
    temp: float
    pressure: float
    vibration: float
    radiation: float
    coolant_flow: float

class AIQueryRequest(BaseModel):
    query: str
    context: dict

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    name: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- DEPENDENCIES ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

async def require_admin(current_user = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

# --- AUTH ENDPOINTS ---
@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate):
    existing_user = await db.user.find_unique(where={"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user_data.password)
    user = await db.user.create(data={
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": hashed_pw,
        "provider": "LOCAL",
        "role": "USER" # Default role
    })
    return {"message": "User created successfully", "user_id": user.id}

@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.user.find_unique(where={"email": form_data.username})
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Store refresh token in DB
    await db.user.update(where={"id": user.id}, data={"refresh_token": refresh_token})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@app.post("/auth/google")
@limiter.limit("10/minute")
async def google_login(request: Request, data: GoogleAuthRequest):
    try:
        # Note: replace GOOGLE_CLIENT_ID with your actual frontend client ID
        # For now, we omit audience validation for demonstration, but it should be added in production.
        idinfo = id_token.verify_oauth2_token(data.token, google_requests.Request())
        email = idinfo.get("email")
        if not email:
            raise ValueError("No email found in token")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = await db.user.find_unique(where={"email": email})
    
    if user:
        if user.role == "ADMIN":
            raise HTTPException(status_code=403, detail="Admins must log in using Email and Password.")
    else:
        # Create user if doesn't exist
        user = await db.user.create(data={
            "email": email,
            "provider": "GOOGLE",
            "role": "USER"
        })
        
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.id})
    await db.user.update(where={"id": user.id}, data={"refresh_token": refresh_token})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@app.post("/auth/refresh")
@limiter.limit("10/minute")
async def refresh(request: Request, data: RefreshTokenRequest):
    payload = verify_token(data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user or user.refresh_token != data.refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")
        
    new_access_token = create_access_token(data={"sub": user.id, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    await db.user.update(where={"id": user.id}, data={"refresh_token": new_refresh_token})
    return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

# --- PROTECTED ENDPOINTS ---
@app.get("/")
def status_endpoint():
    return {"status": "AI Technical Hub Online", "version": "2.5"}

@app.post("/predict")
def predict_status(data: AdvancedReactorData, current_user = Depends(get_current_user)):
    if not model:
        return {"analysis": "MODEL_NOT_FOUND", "confidence_level": "0.00%"}
    features = [[data.temp, data.pressure, data.vibration, data.radiation, data.coolant_flow]]
    prediction = model.predict(features)
    prob = model.predict_proba(features)[0][prediction[0]] * 100
    
    result = "CRITICAL: MELTDOWN RISK" if prediction[0] == 1 else "STABLE OPERATION"
    
    return {
        "analysis": result,
        "confidence_level": f"{prob:.2f}%"
    }

@app.post("/ai-assistant")
def ai_assistant(query_request: AIQueryRequest, current_user = Depends(get_current_user)):
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Assistant is currently unavailable (missing GEMINI_API_KEY environment variable)."
        )
    ctx = query_request.context
    
    try:
        temp = ctx.get('thermal', {}).get('outletTemperature', ctx.get('temp', 0))
        pressure = ctx.get('coolant', {}).get('pressure', ctx.get('pressure', 0))
        flow = ctx.get('coolant', {}).get('flowRate', ctx.get('coolant_flow', 0))
        radiation = ctx.get('radiation', 0)
        vibration = ctx.get('vibration', 0)
    except Exception:
        temp, pressure, flow, radiation, vibration = 0, 0, 0, 0, 0

    system_instruction = "You are a professional Nuclear Engineering AI. Provide accurate, technical, and concise answers. No roleplay or narrative. Use telemetry data only if directly relevant to the query. Prioritize speed and directness."
    user_message = f"Context: T={temp}C, P={pressure}bar, F={flow}%, R={radiation}mSv/h. User Query: {query_request.query}"

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            config={'system_instruction': system_instruction},
            contents=user_message
        )
        return {"response": response.text}
    except Exception as e:
        return {"response": "Unable to generate response. Please try again."}

@app.post("/generate-report")
def generate_report(query_request: AIQueryRequest, current_user = Depends(require_admin)):
    # Example showing RBAC: Only ADMIN users can generate reports.
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Report Generator is currently unavailable (missing GEMINI_API_KEY environment variable)."
        )
    ctx = query_request.context
    
    try:
        temp = ctx.get('thermal', {}).get('outletTemperature', ctx.get('temp', 0))
        pressure = ctx.get('coolant', {}).get('pressure', ctx.get('pressure', 0))
        flow = ctx.get('coolant', {}).get('flowRate', ctx.get('coolant_flow', 0))
        radiation = ctx.get('radiation', 0)
        vibration = ctx.get('vibration', 0)
    except Exception:
        temp, pressure, flow, radiation, vibration = 0, 0, 0, 0, 0
    
    report_prompt = f"Generate a concise Nuclear Engineering Technical Report. Data: {temp}C, {pressure}bar, {vibration}mm/s, {radiation}mSv/h, {flow}%. Include: Executive Summary, Thermal Assessment, Safety Analysis, and Recommendations. Use formal technical language."

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=report_prompt
        )
        return {"response": response.text}
    except Exception as e:
        return {"response": "Unable to generate report. Please check simulation parameters."}

# --- USER PROFILE & PASSWORD MANAGEMENT ---
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters long")

@app.get("/users/me")
async def get_my_profile(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "provider": current_user.provider
    }

@app.put("/users/profile")
async def update_profile(data: UserUpdate, current_user = Depends(get_current_user)):
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.email is not None and data.email != current_user.email:
        # Check if email is already taken
        existing = await db.user.find_unique(where={"email": data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = data.email
    
    if not update_data:
        return {
            "message": "No changes made",
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "role": current_user.role
            }
        }
        
    updated_user = await db.user.update(
        where={"id": current_user.id},
        data=update_data
    )
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user.id,
            "email": updated_user.email,
            "name": updated_user.name,
            "role": updated_user.role
        }
    }

@app.put("/users/password")
async def update_user_password(data: PasswordUpdate, current_user = Depends(get_current_user)):
    if current_user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin password updates are not permitted through this channel. Please use the Admin Dashboard."
        )
    
    if not current_user.hashed_password or not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_pw = get_password_hash(data.new_password)
    await db.user.update(
        where={"id": current_user.id},
        data={"hashed_password": hashed_pw}
    )
    return {"message": "Password updated successfully"}

@app.put("/admin/password")
async def update_admin_password(data: PasswordUpdate, current_user = Depends(require_admin)):
    if not current_user.hashed_password or not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_pw = get_password_hash(data.new_password)
    await db.user.update(
        where={"id": current_user.id},
        data={"hashed_password": hashed_pw}
    )
    return {"message": "Admin password updated successfully"}