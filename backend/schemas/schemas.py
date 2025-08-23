from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# User schemas
class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    token: str

# Patient schemas
class PatientResponse(BaseModel):
    id: int
    name: str
    patient_metadata: Optional[str] = None

# Supplement schemas
class SupplementResponse(BaseModel):
    id: int
    barcode_id: str
    patient_id: int
    supplement_type: str

# Record schemas
class RecordCreate(BaseModel):
    patient_id: int
    supplement_id: int
    pill_count: int
    source: str  # "ai" or "manual"
    confidence: Optional[float] = None
    notes: Optional[str] = None

class RecordResponse(BaseModel):
    id: int
    patient_id: int
    supplement_id: int
    pill_count: int
    source: str
    confidence: Optional[float] = None
    timestamp: datetime
    notes: Optional[str] = None

# Pill detection schemas
class PillCountResult(BaseModel):
    pill_count: int
    confidence: float
    bounding_boxes: List[Dict[str, Any]]
    image_path: str

# Barcode scan response
class BarcodeScanResponse(BaseModel):
    supplement_id: int
    barcode_id: str
    patient_id: int
    patient_name: str

# CSV export response
class CSVExportResponse(BaseModel):
    csv_content: str
