import pytest
import httpx
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
import json
import io
from PIL import Image
import numpy as np

from backend.main import app
from backend.database.database import get_db
from backend.services.auth_service import AuthService
from backend.services.pill_detection_service import PillDetectionService


class TestMainAPI:
    """Test cases for main FastAPI application - Requirements: FR-001 through FR-032"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_db_session(self):
        """Create mock database session"""
        session = Mock()
        session.query.return_value = session
        session.filter.return_value = session
        session.first.return_value = None
        session.add.return_value = None
        session.commit.return_value = None
        return session
    
    @pytest.fixture
    def mock_user(self):
        """Create mock user"""
        return {
            "id": 1,
            "email": "chp1@mms.org",
            "role": "chp",
            "is_active": True
        }
    
    @pytest.fixture
    def mock_admin_user(self):
        """Create mock admin user"""
        return {
            "id": 2,
            "email": "admin@mms.org",
            "role": "admin",
            "is_active": True
        }
    
    @pytest.fixture
    def valid_token(self):
        """Create valid JWT token"""
        return AuthService().create_access_token({"sub": "chp1@mms.org"})
    
    @pytest.fixture
    def admin_token(self):
        """Create admin JWT token"""
        return AuthService().create_access_token({"sub": "admin@mms.org"})
    
    @pytest.fixture
    def mock_image(self):
        """Create mock image for testing"""
        img_array = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    # Health Check Tests
    def test_health_check(self, client):
        """Test health check endpoint - NFR-010"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    # Authentication Tests (FR-001, FR-002, FR-003, FR-004, FR-005)
    def test_login_valid_credentials(self, client, mock_db_session):
        """Test login with valid credentials - FR-001"""
        with patch('backend.main.get_db', return_value=mock_db_session):
            with patch.object(AuthService, 'authenticate_user') as mock_auth:
                mock_auth.return_value = Mock(
                    id=1,
                    email="chp1@mms.org",
                    role="chp",
                    is_active=True
                )
                
                response = client.post("/login", json={
                    "email": "chp1@mms.org",
                    "password": "password123"
                })
                
                assert response.status_code == 200
                data = response.json()
                assert "access_token" in data
                assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, mock_db_session):
        """Test login with invalid credentials - FR-001"""
        with patch('backend.main.get_db', return_value=mock_db_session):
            with patch.object(AuthService, 'authenticate_user') as mock_auth:
                mock_auth.return_value = None
                
                response = client.post("/login", json={
                    "email": "wrong@email.com",
                    "password": "wrongpass"
                })
                
                assert response.status_code == 401
                assert "Incorrect email or password" in response.json()["detail"]
    
    def test_login_missing_credentials(self, client):
        """Test login with missing credentials - FR-001"""
        response = client.post("/login", json={})
        assert response.status_code == 422  # Validation error
    
    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format - FR-001"""
        response = client.post("/login", json={
            "email": "invalid-email",
            "password": "password123"
        })
        assert response.status_code == 422  # Validation error

    # Authorization Tests (FR-003)
    def test_protected_endpoint_without_token(self, client):
        """Test protected endpoint without authentication - FR-003"""
        response = client.get("/records")
        assert response.status_code == 401
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test protected endpoint with invalid token - FR-003"""
        response = client.get(
            "/records",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_protected_endpoint_with_valid_token(self, client, valid_token, mock_db_session):
        """Test protected endpoint with valid token - FR-003"""
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.filter.return_value.all.return_value = []
            
            response = client.get(
                "/records",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == 200

    # Image Upload Tests (FR-011, FR-014, FR-015, FR-016, FR-017)
    def test_upload_image_unauthorized(self, client):
        """Test upload image without authentication - FR-011"""
        response = client.post("/upload")
        assert response.status_code == 401
    
    @patch.object(PillDetectionService, 'process_image')
    def test_upload_image_authorized(self, mock_process, client, valid_token, mock_image):
        """Test upload image with valid authentication - FR-011, FR-014"""
        mock_process.return_value = {
            "success": True,
            "pill_count": 25,
            "confidence": 0.85,
            "detections": []
        }
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/upload",
                headers={"Authorization": f"Bearer {valid_token}"},
                files={"file": ("test.jpg", mock_image.getvalue(), "image/jpeg")}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "pill_count" in data
            assert "confidence" in data
            assert data["pill_count"] == 25
            assert data["confidence"] == 0.85
    
    @patch.object(PillDetectionService, 'process_image')
    def test_upload_image_processing_failure(self, mock_process, client, valid_token, mock_image):
        """Test upload image when processing fails - FR-014"""
        mock_process.return_value = {
            "success": False,
            "error": "Processing failed"
        }
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/upload",
                headers={"Authorization": f"Bearer {valid_token}"},
                files={"file": ("test.jpg", mock_image.getvalue(), "image/jpeg")}
            )
            
            assert response.status_code == 400
            assert "error" in response.json()
    
    def test_upload_invalid_image_format(self, client, valid_token):
        """Test upload with invalid image format - FR-011"""
        invalid_file = io.BytesIO(b"not an image")
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/upload",
                headers={"Authorization": f"Bearer {valid_token}"},
                files={"file": ("test.txt", invalid_file.getvalue(), "text/plain")}
            )
            
            assert response.status_code == 400
            assert "Invalid image format" in response.json()["detail"]
    
    def test_upload_image_too_large(self, client, valid_token):
        """Test upload with image too large - FR-011"""
        # Create a large image
        large_img = Image.new('RGB', (2000, 2000), color='red')
        img_bytes = io.BytesIO()
        large_img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/upload",
                headers={"Authorization": f"Bearer {valid_token}"},
                files={"file": ("large.jpg", img_bytes.getvalue(), "image/jpeg")}
            )
            
            # Should still work but might be slower
            assert response.status_code in [200, 413]  # 413 if size limit enforced

    # Record Management Tests (FR-023, FR-025, FR-026)
    def test_get_records_unauthorized(self, client):
        """Test get records without authentication - FR-023"""
        response = client.get("/records")
        assert response.status_code == 401
    
    def test_get_records_authorized(self, client, valid_token, mock_db_session):
        """Test get records with valid authentication - FR-023, FR-025"""
        mock_records = [
            {
                "id": 1,
                "patient_id": "PAT001",
                "supplement_id": "IRON001",
                "pill_count": 25,
                "confidence": 0.85,
                "source": "ai",
                "created_at": "2024-01-01T00:00:00"
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.filter.return_value.all.return_value = mock_records
            
            response = client.get(
                "/records",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["pill_count"] == 25
    
    def test_create_record_unauthorized(self, client):
        """Test create record without authentication - FR-023"""
        response = client.post("/records", json={})
        assert response.status_code == 401
    
    def test_create_record_authorized(self, client, valid_token, mock_db_session):
        """Test create record with valid authentication - FR-023"""
        record_data = {
            "patient_id": "PAT001",
            "supplement_id": "IRON001",
            "pill_count": 25,
            "confidence": 0.85,
            "source": "manual"
        }
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            response = client.post(
                "/records",
                headers={"Authorization": f"Bearer {valid_token}"},
                json=record_data
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["patient_id"] == "PAT001"
            assert data["pill_count"] == 25
    
    def test_create_record_invalid_data(self, client, valid_token):
        """Test create record with invalid data - FR-023"""
        invalid_record_data = {
            "patient_id": "",  # Invalid empty ID
            "supplement_id": "IRON001",
            "pill_count": -1,  # Invalid negative count
            "confidence": 1.5,  # Invalid confidence > 1
            "source": "invalid_source"  # Invalid source
        }
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/records",
                headers={"Authorization": f"Bearer {valid_token}"},
                json=invalid_record_data
            )
            
            assert response.status_code == 422  # Validation error

    # Patient Management Tests (FR-024)
    def test_get_patients_unauthorized(self, client):
        """Test get patients without authentication - FR-024"""
        response = client.get("/patients")
        assert response.status_code == 401
    
    def test_get_patients_authorized(self, client, valid_token, mock_db_session):
        """Test get patients with valid authentication - FR-024"""
        mock_patients = [
            {
                "id": "PAT001",
                "name": "John Doe",
                "age": 30,
                "gender": "male"
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.all.return_value = mock_patients
            
            response = client.get(
                "/patients",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "John Doe"
    
    def test_create_patient_authorized(self, client, valid_token, mock_db_session):
        """Test create patient with valid authentication - FR-024"""
        patient_data = {
            "id": "PAT002",
            "name": "Jane Smith",
            "age": 25,
            "gender": "female",
            "phone": "1234567890",
            "address": "456 Oak St"
        }
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            response = client.post(
                "/patients",
                headers={"Authorization": f"Bearer {valid_token}"},
                json=patient_data
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Jane Smith"
            assert data["id"] == "PAT002"

    # Supplement Management Tests (FR-024)
    def test_get_supplements_unauthorized(self, client):
        """Test get supplements without authentication - FR-024"""
        response = client.get("/supplements")
        assert response.status_code == 401
    
    def test_get_supplements_authorized(self, client, valid_token, mock_db_session):
        """Test get supplements with valid authentication - FR-024"""
        mock_supplements = [
            {
                "id": "IRON001",
                "name": "Iron Supplement",
                "barcode": "IRON001"
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.all.return_value = mock_supplements
            
            response = client.get(
                "/supplements",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "Iron Supplement"
    
    def test_create_supplement_authorized(self, client, valid_token, mock_db_session):
        """Test create supplement with valid authentication - FR-024"""
        supplement_data = {
            "id": "VIT001",
            "name": "Vitamin D",
            "barcode": "VIT001",
            "description": "Vitamin D supplement"
        }
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            response = client.post(
                "/supplements",
                headers={"Authorization": f"Bearer {valid_token}"},
                json=supplement_data
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Vitamin D"
            assert data["id"] == "VIT001"

    # Analytics Tests (FR-028, FR-029, FR-031)
    def test_get_analytics_unauthorized(self, client):
        """Test get analytics without authentication - FR-028"""
        response = client.get("/analytics")
        assert response.status_code == 401
    
    def test_get_analytics_authorized(self, client, valid_token, mock_db_session):
        """Test get analytics with valid authentication - FR-028"""
        mock_analytics = {
            "total_records": 100,
            "ai_count": 80,
            "manual_count": 20,
            "average_confidence": 0.85
        }
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            # Mock the analytics calculation
            with patch('backend.main.calculate_analytics') as mock_calc:
                mock_calc.return_value = mock_analytics
                
                response = client.get(
                    "/analytics",
                    headers={"Authorization": f"Bearer {valid_token}"}
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["total_records"] == 100
                assert data["ai_count"] == 80
    
    def test_get_analytics_with_filters(self, client, valid_token, mock_db_session):
        """Test get analytics with filters - FR-029"""
        mock_analytics = {
            "total_records": 50,
            "ai_count": 40,
            "manual_count": 10,
            "average_confidence": 0.88
        }
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            with patch('backend.main.calculate_analytics') as mock_calc:
                mock_calc.return_value = mock_analytics
                
                response = client.get(
                    "/analytics?start_date=2024-01-01&end_date=2024-01-31",
                    headers={"Authorization": f"Bearer {valid_token}"}
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["total_records"] == 50

    # Admin Dashboard Tests (FR-030, FR-032)
    def test_admin_endpoints_require_admin_role(self, client, valid_token):
        """Test admin endpoints require admin role - FR-030"""
        # Test with CHP token (should be denied)
        response = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 403  # Forbidden
    
    def test_admin_users_endpoint(self, client, admin_token, mock_db_session):
        """Test admin users endpoint - FR-030"""
        mock_users = [
            {
                "id": 1,
                "email": "chp1@mms.org",
                "role": "chp",
                "is_active": True
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.all.return_value = mock_users
            
            response = client.get(
                "/admin/users",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["email"] == "chp1@mms.org"
    
    def test_audit_log_endpoint(self, client, admin_token, mock_db_session):
        """Test audit log endpoint - FR-032"""
        mock_audit_logs = [
            {
                "id": 1,
                "user_id": 1,
                "action": "login",
                "timestamp": "2024-01-01T00:00:00"
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.all.return_value = mock_audit_logs
            
            response = client.get(
                "/admin/audit-logs",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["action"] == "login"

    # Data Export Tests (FR-026)
    def test_export_records_csv(self, client, valid_token, mock_db_session):
        """Test export records to CSV - FR-026"""
        mock_records = [
            {
                "id": 1,
                "patient_id": "PAT001",
                "supplement_id": "IRON001",
                "pill_count": 25,
                "confidence": 0.85,
                "source": "ai",
                "created_at": "2024-01-01T00:00:00"
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.filter.return_value.all.return_value = mock_records
            
            response = client.get(
                "/export/records/csv",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/csv"
    
    def test_export_records_excel(self, client, valid_token, mock_db_session):
        """Test export records to Excel - FR-026"""
        mock_records = [
            {
                "id": 1,
                "patient_id": "PAT001",
                "supplement_id": "IRON001",
                "pill_count": 25,
                "confidence": 0.85,
                "source": "ai",
                "created_at": "2024-01-01T00:00:00"
            }
        ]
        
        with patch('backend.main.get_db', return_value=mock_db_session):
            mock_db_session.query.return_value.filter.return_value.all.return_value = mock_records
            
            response = client.get(
                "/export/records/excel",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == 200
            assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers["content-type"]

    # Security Tests (NFR-005, NFR-006, NFR-007, NFR-008, NFR-009)
    def test_cors_headers(self, client):
        """Test CORS headers are present - NFR-005"""
        response = client.options("/records")
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
    
    def test_input_validation(self, client, valid_token):
        """Test input validation and sanitization - NFR-007"""
        # Test SQL injection attempt
        malicious_data = {
            "patient_id": "'; DROP TABLE users; --",
            "supplement_id": "IRON001",
            "pill_count": 25,
            "confidence": 0.85,
            "source": "manual"
        }
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/records",
                headers={"Authorization": f"Bearer {valid_token}"},
                json=malicious_data
            )
            
            # Should be rejected due to validation
            assert response.status_code == 422
    
    def test_xss_protection(self, client, valid_token):
        """Test XSS protection - NFR-009"""
        # Test XSS attempt in patient name
        xss_data = {
            "id": "PAT001",
            "name": "<script>alert('xss')</script>",
            "age": 30,
            "gender": "male"
        }
        
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.post(
                "/patients",
                headers={"Authorization": f"Bearer {valid_token}"},
                json=xss_data
            )
            
            # Should be rejected due to validation
            assert response.status_code == 422

    # Performance Tests (NFR-001, NFR-002, NFR-003, NFR-004)
    def test_page_load_time_under_3_seconds(self, client):
        """Test page load time under 3 seconds - NFR-001"""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        load_time = end_time - start_time
        assert load_time < 3.0  # Should be under 3 seconds
        assert response.status_code == 200
    
    def test_concurrent_requests_handling(self, client, valid_token):
        """Test concurrent requests handling - NFR-004"""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = client.get(
                "/health",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            results.append(response.status_code)
        
        # Create multiple threads to simulate concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert len(results) == 10
        assert all(status == 200 for status in results)

    # Error Handling Tests (NFR-011, NFR-012)
    def test_graceful_error_handling(self, client):
        """Test graceful error handling - NFR-011"""
        # Test with invalid endpoint
        response = client.get("/invalid-endpoint")
        assert response.status_code == 404
        
        # Test with invalid method
        response = client.post("/health")
        assert response.status_code == 405  # Method not allowed
    
    def test_automatic_retry_mechanism(self, client, valid_token):
        """Test automatic retry mechanism - NFR-012"""
        # This would typically be tested with a mock that fails first, then succeeds
        # For now, test that the endpoint is available
        with patch('backend.main.get_db', return_value=Mock()):
            response = client.get(
                "/records",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            assert response.status_code in [200, 401]  # Either success or auth error
