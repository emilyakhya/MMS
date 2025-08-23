from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
import os
import json
from datetime import datetime
from typing import List, Optional

from database.database import get_db, engine
from database.models import Base, User, Patient, Supplement, Record
from services.auth_service import AuthService
from services.pill_detection_service import PillDetectionService
from schemas.schemas import (
    UserLogin, UserResponse, RecordCreate, RecordResponse,
    PatientResponse, SupplementResponse, PillCountResult
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MMS Pill Counting API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
auth_service = AuthService()
pill_detection_service = PillDetectionService()

@app.post("/login", response_model=UserResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate CHP user"""
    user = auth_service.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth_service.create_access_token(data={"sub": user.email})
    return UserResponse(id=user.id, email=user.email, name=user.name, token=token)

@app.get("/patients", response_model=List[PatientResponse])
async def get_patients(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get list of patients"""
    user = auth_service.get_current_user(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    patients = db.query(Patient).all()
    return [PatientResponse(id=p.id, name=p.name, patient_metadata=p.patient_metadata) for p in patients]

@app.post("/scan")
async def scan_barcode(
    barcode_id: str = Form(...),
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Scan supplement barcode and return patient info"""
    user = auth_service.get_current_user(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    supplement = db.query(Supplement).filter(Supplement.barcode_id == barcode_id).first()
    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")
    
    patient = db.query(Patient).filter(Patient.id == supplement.patient_id).first()
    return {
        "supplement_id": supplement.id,
        "barcode_id": supplement.barcode_id,
        "patient_id": patient.id,
        "patient_name": patient.name
    }

@app.post("/upload", response_model=PillCountResult)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Upload pill bottle image and get AI count"""
    user = auth_service.get_current_user(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save uploaded image temporarily
    temp_path = f"temp_{datetime.now().timestamp()}.jpg"
    try:
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Run YOLOv8 detection
        result = pill_detection_service.detect_pills(temp_path)
        
        return PillCountResult(
            pill_count=result["count"],
            confidence=result["confidence"],
            bounding_boxes=result["bounding_boxes"],
            image_path=temp_path
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/submit", response_model=RecordResponse)
async def submit_record(
    record_data: RecordCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Submit final pill count (AI or manual)"""
    user = auth_service.get_current_user(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Create new record
    record = Record(
        patient_id=record_data.patient_id,
        supplement_id=record_data.supplement_id,
        pill_count=record_data.pill_count,
        source=record_data.source,
        confidence=record_data.confidence,
        timestamp=datetime.now()
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return RecordResponse(
        id=record.id,
        patient_id=record.patient_id,
        supplement_id=record.supplement_id,
        pill_count=record.pill_count,
        source=record.source,
        confidence=record.confidence,
        timestamp=record.timestamp
    )

@app.get("/records", response_model=List[RecordResponse])
async def get_records(
    patient_id: Optional[int] = None,
    supplement_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get pill count records with optional filtering"""
    user = auth_service.get_current_user(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    query = db.query(Record)
    
    if patient_id:
        query = query.filter(Record.patient_id == patient_id)
    if supplement_id:
        query = query.filter(Record.supplement_id == supplement_id)
    if start_date:
        query = query.filter(Record.timestamp >= start_date)
    if end_date:
        query = query.filter(Record.timestamp <= end_date)
    
    records = query.order_by(Record.timestamp.desc()).all()
    
    return [RecordResponse(
        id=r.id,
        patient_id=r.patient_id,
        supplement_id=r.supplement_id,
        pill_count=r.pill_count,
        source=r.source,
        confidence=r.confidence,
        timestamp=r.timestamp
    ) for r in records]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/export/csv")
async def export_csv(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Export records as CSV"""
    user = auth_service.get_current_user(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    records = db.query(Record).all()
    
    # Create CSV content
    csv_content = "ID,Patient ID,Supplement ID,Pill Count,Source,Confidence,Timestamp\n"
    for record in records:
        csv_content += f"{record.id},{record.patient_id},{record.supplement_id},{record.pill_count},{record.source},{record.confidence},{record.timestamp}\n"
    
    return {"csv_content": csv_content}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
