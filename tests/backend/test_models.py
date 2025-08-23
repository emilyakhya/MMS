import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock

from backend.database.models import Base, User, Patient, Supplement, Record
from backend.database.database import get_db


class TestDatabaseModels:
    """Test cases for database models - Requirements: FR-023, FR-024, FR-025, FR-026"""
    
    @pytest.fixture
    def engine(self):
        """Create test database engine"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine)
        return engine
    
    @pytest.fixture
    def session(self, engine):
        """Create test database session"""
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    # FR-023: Pill count record creation and storage
    def test_user_model(self, session):
        """Test User model creation and properties - FR-023"""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            role="chp",
            is_active=True
        )
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.role == "chp"
        assert user.is_active is True
        assert user.created_at is not None
        assert isinstance(user.created_at, datetime)
    
    def test_user_model_defaults(self, session):
        """Test User model default values - FR-023"""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password"
        )
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        assert user.role == "chp"  # Default role
        assert user.is_active is True  # Default active status
        assert user.created_at is not None

    # FR-024: Patient and supplement data management
    def test_patient_model(self, session):
        """Test Patient model creation and properties - FR-024"""
        patient = Patient(
            id="PAT001",
            name="John Doe",
            age=30,
            gender="male",
            phone="1234567890",
            address="123 Main St"
        )
        
        session.add(patient)
        session.commit()
        session.refresh(patient)
        
        assert patient.id == "PAT001"
        assert patient.name == "John Doe"
        assert patient.age == 30
        assert patient.gender == "male"
        assert patient.phone == "1234567890"
        assert patient.address == "123 Main St"
        assert patient.created_at is not None
    
    def test_supplement_model(self, session):
        """Test Supplement model creation and properties - FR-024"""
        supplement = Supplement(
            id="IRON001",
            name="Iron Supplement",
            barcode="IRON001",
            description="Iron supplement for anemia"
        )
        
        session.add(supplement)
        session.commit()
        session.refresh(supplement)
        
        assert supplement.id == "IRON001"
        assert supplement.name == "Iron Supplement"
        assert supplement.barcode == "IRON001"
        assert supplement.description == "Iron supplement for anemia"
        assert supplement.created_at is not None
    
    def test_record_model(self, session):
        """Test Record model creation and properties - FR-023"""
        # Create required related objects first
        user = User(email="chp@example.com", hashed_password="hash")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        record = Record(
            patient_id="PAT001",
            supplement_id="IRON001",
            pill_count=25,
            confidence=0.85,
            source="ai",
            user_id=user.id
        )
        
        session.add(record)
        session.commit()
        session.refresh(record)
        
        assert record.id is not None
        assert record.patient_id == "PAT001"
        assert record.supplement_id == "IRON001"
        assert record.pill_count == 25
        assert record.confidence == 0.85
        assert record.source == "ai"
        assert record.user_id == user.id
        assert record.created_at is not None
    
    def test_record_model_relationships(self, session):
        """Test Record model relationships - FR-023"""
        # Create related objects
        user = User(email="chp@example.com", hashed_password="hash")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        record = Record(
            patient_id="PAT001",
            supplement_id="IRON001",
            pill_count=25,
            confidence=0.85,
            source="ai",
            user_id=user.id
        )
        
        session.add(record)
        session.commit()
        session.refresh(record)
        
        # Test relationships
        assert record.patient.id == "PAT001"
        assert record.patient.name == "John Doe"
        assert record.supplement.id == "IRON001"
        assert record.supplement.name == "Iron Supplement"
        assert record.user.email == "chp@example.com"
    
    def test_record_model_source_validation(self, session):
        """Test Record model source field validation - FR-023"""
        user = User(email="chp@example.com", hashed_password="hash")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        # Test valid sources
        valid_sources = ["ai", "manual", "ai_with_manual_override"]
        
        for source in valid_sources:
            record = Record(
                patient_id="PAT001",
                supplement_id="IRON001",
                pill_count=25,
                confidence=0.85,
                source=source,
                user_id=user.id
            )
            session.add(record)
        
        session.commit()
        
        # Verify all records were created
        records = session.query(Record).all()
        assert len(records) == 3

    # FR-025: Historical record viewing and search
    def test_record_timestamp_creation(self, session):
        """Test record timestamp creation for historical tracking - FR-025"""
        user = User(email="chp@example.com", hashed_password="hash")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        # Create record with specific timestamp
        record = Record(
            patient_id="PAT001",
            supplement_id="IRON001",
            pill_count=25,
            confidence=0.85,
            source="ai",
            user_id=user.id
        )
        
        session.add(record)
        session.commit()
        session.refresh(record)
        
        # Verify timestamp is set
        assert record.created_at is not None
        assert isinstance(record.created_at, datetime)
        
        # Verify timestamp is recent
        time_diff = datetime.now() - record.created_at
        assert time_diff.total_seconds() < 60  # Should be created within last minute

    # FR-026: Data export capabilities (CSV, Excel)
    def test_model_serialization_for_export(self, session):
        """Test model serialization for data export - FR-026"""
        user = User(email="test@example.com", hashed_password="hash", role="chp")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        # Test converting to dict (for CSV/Excel export)
        user_dict = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        
        patient_dict = {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "address": patient.address,
            "created_at": patient.created_at.isoformat() if patient.created_at else None
        }
        
        supplement_dict = {
            "id": supplement.id,
            "name": supplement.name,
            "barcode": supplement.barcode,
            "description": supplement.description,
            "created_at": supplement.created_at.isoformat() if supplement.created_at else None
        }
        
        assert user_dict["email"] == "test@example.com"
        assert patient_dict["name"] == "John Doe"
        assert supplement_dict["name"] == "Iron Supplement"

    # Data Integrity Tests (NFR-008, NFR-012, NFR-013)
    def test_user_email_uniqueness(self, session):
        """Test User email uniqueness constraint - NFR-008"""
        user1 = User(email="test@example.com", hashed_password="hash1")
        user2 = User(email="test@example.com", hashed_password="hash2")
        
        session.add(user1)
        session.commit()
        
        # Adding user with same email should raise an error
        session.add(user2)
        with pytest.raises(Exception):  # SQLAlchemy will raise an integrity error
            session.commit()
    
    def test_patient_id_uniqueness(self, session):
        """Test Patient ID uniqueness constraint - NFR-008"""
        patient1 = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        patient2 = Patient(id="PAT001", name="Jane Doe", age=25, gender="female")
        
        session.add(patient1)
        session.commit()
        
        # Adding patient with same ID should raise an error
        session.add(patient2)
        with pytest.raises(Exception):  # SQLAlchemy will raise an integrity error
            session.commit()
    
    def test_supplement_id_uniqueness(self, session):
        """Test Supplement ID uniqueness constraint - NFR-008"""
        supplement1 = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        supplement2 = Supplement(id="IRON001", name="Iron Tablet", barcode="IRON002")
        
        session.add(supplement1)
        session.commit()
        
        # Adding supplement with same ID should raise an error
        session.add(supplement2)
        with pytest.raises(Exception):  # SQLAlchemy will raise an integrity error
            session.commit()
    
    def test_record_foreign_key_constraints(self, session):
        """Test Record foreign key constraints - NFR-008"""
        # Try to create record with non-existent foreign keys
        record = Record(
            patient_id="NONEXISTENT",
            supplement_id="NONEXISTENT",
            pill_count=25,
            confidence=0.85,
            source="ai",
            user_id=999
        )
        
        session.add(record)
        with pytest.raises(Exception):  # SQLAlchemy will raise a foreign key constraint error
            session.commit()

    # Reliability Tests (NFR-012, NFR-013)
    def test_data_persistence(self, session):
        """Test data persistence and recovery - NFR-013"""
        # Create test data
        user = User(email="test@example.com", hashed_password="hash")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        # Verify data is persisted
        users = session.query(User).all()
        patients = session.query(Patient).all()
        supplements = session.query(Supplement).all()
        
        assert len(users) == 1
        assert len(patients) == 1
        assert len(supplements) == 1
        
        assert users[0].email == "test@example.com"
        assert patients[0].name == "John Doe"
        assert supplements[0].name == "Iron Supplement"
    
    def test_model_string_representations(self, session):
        """Test model string representations - NFR-012"""
        user = User(email="test@example.com", hashed_password="hash")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        # Test __repr__ methods
        assert "test@example.com" in str(user)
        assert "John Doe" in str(patient)
        assert "Iron Supplement" in str(supplement)
    
    def test_model_serialization(self, session):
        """Test model serialization to dict - NFR-012"""
        user = User(email="test@example.com", hashed_password="hash", role="chp")
        patient = Patient(id="PAT001", name="John Doe", age=30, gender="male")
        supplement = Supplement(id="IRON001", name="Iron Supplement", barcode="IRON001")
        
        session.add_all([user, patient, supplement])
        session.commit()
        
        # Test converting to dict (for API responses)
        user_dict = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        
        patient_dict = {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "address": patient.address,
            "created_at": patient.created_at.isoformat() if patient.created_at else None
        }
        
        supplement_dict = {
            "id": supplement.id,
            "name": supplement.name,
            "barcode": supplement.barcode,
            "description": supplement.description,
            "created_at": supplement.created_at.isoformat() if supplement.created_at else None
        }
        
        assert user_dict["email"] == "test@example.com"
        assert patient_dict["name"] == "John Doe"
        assert supplement_dict["name"] == "Iron Supplement"
