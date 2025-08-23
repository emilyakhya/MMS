from sqlalchemy.orm import Session
from database.database import SessionLocal, engine
from database.models import Base, User, Patient, Supplement
from services.auth_service import AuthService
import json

# Create tables
Base.metadata.create_all(bind=engine)

def init_db():
    """Initialize database with sample data"""
    db = SessionLocal()
    auth_service = AuthService()
    
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already initialized with sample data.")
            return
        
        # Create sample CHP users
        users_data = [
            {
                "email": "chp1@mms.org",
                "name": "Sarah Johnson",
                "password": "password123"
            },
            {
                "email": "chp2@mms.org", 
                "name": "Michael Chen",
                "password": "password123"
            },
            {
                "email": "manager@mms.org",
                "name": "Dr. Emily Rodriguez",
                "password": "password123"
            }
        ]
        
        for user_data in users_data:
            hashed_password = auth_service.get_password_hash(user_data["password"])
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                hashed_password=hashed_password
            )
            db.add(user)
        
        # Create sample patients
        patients_data = [
            {
                "name": "Maria Garcia",
                "metadata": json.dumps({
                    "age": 28,
                    "gestation_weeks": 24,
                    "location": "Village A",
                    "contact": "+1234567890"
                })
            },
            {
                "name": "Fatima Hassan",
                "metadata": json.dumps({
                    "age": 32,
                    "gestation_weeks": 18,
                    "location": "Village B", 
                    "contact": "+1234567891"
                })
            },
            {
                "name": "Aisha Patel",
                "metadata": json.dumps({
                    "age": 25,
                    "gestation_weeks": 30,
                    "location": "Village C",
                    "contact": "+1234567892"
                })
            },
            {
                "name": "Grace Ochieng",
                "metadata": json.dumps({
                    "age": 29,
                    "gestation_weeks": 12,
                    "location": "Village D",
                    "contact": "+1234567893"
                })
            },
            {
                "name": "Lakshmi Devi",
                "metadata": json.dumps({
                    "age": 31,
                    "gestation_weeks": 36,
                    "location": "Village E",
                    "contact": "+1234567894"
                })
            }
        ]
        
        for patient_data in patients_data:
            patient = Patient(
                name=patient_data["name"],
                patient_metadata=patient_data["metadata"]
            )
            db.add(patient)
        
        db.commit()
        
        # Get created patients for supplement assignment
        patients = db.query(Patient).all()
        
        # Create sample supplements with barcodes
        supplements_data = [
            {"barcode_id": "IRON001", "patient_id": patients[0].id, "supplement_type": "iron"},
            {"barcode_id": "FOLIC001", "patient_id": patients[0].id, "supplement_type": "folic_acid"},
            {"barcode_id": "IRON002", "patient_id": patients[1].id, "supplement_type": "iron"},
            {"barcode_id": "FOLIC002", "patient_id": patients[1].id, "supplement_type": "folic_acid"},
            {"barcode_id": "IRON003", "patient_id": patients[2].id, "supplement_type": "iron"},
            {"barcode_id": "FOLIC003", "patient_id": patients[2].id, "supplement_type": "folic_acid"},
            {"barcode_id": "IRON004", "patient_id": patients[3].id, "supplement_type": "iron"},
            {"barcode_id": "FOLIC004", "patient_id": patients[3].id, "supplement_type": "folic_acid"},
            {"barcode_id": "IRON005", "patient_id": patients[4].id, "supplement_type": "iron"},
            {"barcode_id": "FOLIC005", "patient_id": patients[4].id, "supplement_type": "folic_acid"},
        ]
        
        for supplement_data in supplements_data:
            supplement = Supplement(
                barcode_id=supplement_data["barcode_id"],
                patient_id=supplement_data["patient_id"],
                supplement_type=supplement_data["supplement_type"]
            )
            db.add(supplement)
        
        db.commit()
        
        print("Database initialized successfully!")
        print(f"Created {len(users_data)} users")
        print(f"Created {len(patients_data)} patients")
        print(f"Created {len(supplements_data)} supplements")
        
        print("\nSample login credentials:")
        print("CHP 1: chp1@mms.org / password123")
        print("CHP 2: chp2@mms.org / password123")
        print("Manager: manager@mms.org / password123")
        
        print("\nSample barcodes for testing:")
        for supplement_data in supplements_data:
            print(f"Barcode: {supplement_data['barcode_id']} -> Patient: {supplement_data['patient_id']}")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
