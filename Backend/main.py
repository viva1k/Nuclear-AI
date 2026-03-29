from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="Nuclear AI - ARCS Enterprise v2.0")

# --- SECURITY SETTINGS (CORS) ---
# This allows your Netlify site to talk to this backend
origins = [
    "https://nuclearaiphase1.netlify.app",
    "http://localhost:3000", # Helps your engineer test locally
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the AI Brain
model = joblib.load('model.pkl')

class AdvancedReactorData(BaseModel):
    temp: float
    pressure: float
    vibration: float
    radiation: float
    coolant_flow: float

@app.get("/")
def status():
    return {"status": "Nuclear AI Online", "version": "2.0"}

@app.post("/predict")
def predict_status(data: AdvancedReactorData):
    features = [[data.temp, data.pressure, data.vibration, data.radiation, data.coolant_flow]]
    prediction = model.predict(features)
    prob = model.predict_proba(features)[0][prediction[0]] * 100
    
    result = "CRITICAL: MELTDOWN RISK" if prediction[0] == 1 else "STABLE OPERATION"
    
    return {
        "analysis": result,
        "confidence_level": f"{prob:.2f}%"
    }