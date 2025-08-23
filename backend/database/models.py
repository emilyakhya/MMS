from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="chp")  # "chp" or "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    patient_metadata = Column(Text)  # JSON string for additional patient info
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    supplements = relationship("Supplement", back_populates="patient")
    records = relationship("Record", back_populates="patient")

class Supplement(Base):
    __tablename__ = "supplements"
    
    id = Column(Integer, primary_key=True, index=True)
    barcode_id = Column(String, unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    supplement_type = Column(String)  # e.g., "iron", "folic_acid"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="supplements")
    records = relationship("Record", back_populates="supplement")

class Record(Base):
    __tablename__ = "records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    supplement_id = Column(Integer, ForeignKey("supplements.id"))
    pill_count = Column(Integer)
    source = Column(String)  # "ai" or "manual"
    confidence = Column(Float, nullable=True)  # AI confidence score
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="records")
    supplement = relationship("Supplement", back_populates="records")
