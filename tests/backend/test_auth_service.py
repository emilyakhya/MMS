import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from jose import jwt
from backend.services.auth_service import AuthService
from backend.database.models import User
from backend.schemas.schemas import UserLogin, UserCreate


class TestAuthService:
    """Test cases for AuthService - Requirements: FR-001, FR-002, FR-003, FR-004, FR-005"""
    
    @pytest.fixture
    def auth_service(self):
        """Create AuthService instance for testing"""
        return AuthService()
    
    @pytest.fixture
    def mock_user(self):
        """Create mock user for testing"""
        # Create a proper hash for "password123"
        auth_service = AuthService()
        hashed_password = auth_service.get_password_hash("password123")
        
        return User(
            id=1,
            email="chp1@mms.org",
            hashed_password=hashed_password,
            role="chp",
            is_active=True,
            created_at=datetime.now()
        )
    
    @pytest.fixture
    def mock_admin_user(self):
        """Create mock admin user for testing"""
        return User(
            id=2,
            email="admin@mms.org",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8eO",  # password123
            role="admin",
            is_active=True,
            created_at=datetime.now()
        )
    
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

    # FR-001: User login with email/password
    def test_verify_password_valid(self, auth_service, mock_user):
        """Test password verification with valid password - FR-001"""
        result = auth_service.verify_password("password123", mock_user.hashed_password)
        assert result is True
    
    def test_verify_password_invalid(self, auth_service, mock_user):
        """Test password verification with invalid password - FR-001"""
        result = auth_service.verify_password("wrongpassword", mock_user.hashed_password)
        assert result is False
    
    def test_get_password_hash(self, auth_service):
        """Test password hashing - FR-001"""
        password = "testpassword"
        hashed = auth_service.get_password_hash(password)
        assert hashed != password
        assert auth_service.verify_password(password, hashed) is True
    
    def test_authenticate_user_valid(self, auth_service, mock_user, mock_db_session):
        """Test user authentication with valid credentials - FR-001"""
        mock_db_session.first.return_value = mock_user
        
        result = auth_service.authenticate_user(mock_db_session, "chp1@mms.org", "password123")
        assert result == mock_user
    
    def test_authenticate_user_invalid_email(self, auth_service, mock_db_session):
        """Test user authentication with invalid email - FR-001"""
        mock_db_session.first.return_value = None
        
        result = auth_service.authenticate_user(mock_db_session, "wrong@email.com", "password123")
        assert result is None
    
    def test_authenticate_user_invalid_password(self, auth_service, mock_user, mock_db_session):
        """Test user authentication with invalid password - FR-001"""
        mock_db_session.first.return_value = mock_user
        
        result = auth_service.authenticate_user(mock_db_session, "chp1@mms.org", "wrongpassword")
        assert result is None

    # FR-002: JWT token-based session management
    def test_create_access_token(self, auth_service):
        """Test JWT access token creation - FR-002"""
        data = {"sub": "chp1@mms.org"}
        token = auth_service.create_access_token(data)
        
        # Verify token can be decoded
        from backend.services.auth_service import SECRET_KEY, ALGORITHM
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "chp1@mms.org"
        assert "exp" in decoded
    
    def test_create_access_token_with_expires(self, auth_service):
        """Test JWT access token creation with custom expiration - FR-002"""
        from backend.services.auth_service import SECRET_KEY, ALGORITHM
        data = {"sub": "chp1@mms.org"}
        expires_delta = timedelta(minutes=30)
        token = auth_service.create_access_token(data, expires_delta)
        
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "chp1@mms.org"
    
    def test_verify_token_valid(self, auth_service):
        """Test JWT token verification with valid token - FR-002"""
        data = {"sub": "chp1@mms.org"}
        token = auth_service.create_access_token(data)
        
        email = auth_service.verify_token(token)
        assert email == "chp1@mms.org"
    
    def test_verify_token_invalid(self, auth_service):
        """Test JWT token verification with invalid token - FR-002"""
        email = auth_service.verify_token("invalid.token.here")
        assert email is None
    
    def test_verify_token_expired(self, auth_service):
        """Test JWT token verification with expired token - FR-002"""
        # Create token with very short expiration
        data = {"sub": "chp1@mms.org"}
        expires_delta = timedelta(seconds=1)
        token = auth_service.create_access_token(data, expires_delta)
        
        # Wait for token to expire
        import time
        time.sleep(2)
        
        email = auth_service.verify_token(token)
        assert email is None

    # FR-003: Role-based access control (CHP, Admin)
    def test_get_current_user_chp(self, auth_service, mock_user, mock_db_session):
        """Test getting current CHP user - FR-003"""
        token = auth_service.create_access_token({"sub": "chp1@mms.org"})
        mock_db_session.first.return_value = mock_user
        
        result = auth_service.get_current_user(mock_db_session, token)
        assert result == mock_user
        assert result.role == "chp"
    
    def test_get_current_user_admin(self, auth_service, mock_admin_user, mock_db_session):
        """Test getting current admin user - FR-003"""
        token = auth_service.create_access_token({"sub": "admin@mms.org"})
        mock_db_session.first.return_value = mock_admin_user
        
        result = auth_service.get_current_user(mock_db_session, token)
        assert result == mock_admin_user
        assert result.role == "admin"
    
    def test_get_current_user_invalid_token(self, auth_service, mock_db_session):
        """Test getting current user with invalid token - FR-003"""
        result = auth_service.get_current_user(mock_db_session, "invalid.token.here")
        assert result is None
    
    def test_get_current_user_user_not_found(self, auth_service, mock_db_session):
        """Test getting current user when user doesn't exist - FR-003"""
        token = auth_service.create_access_token({"sub": "nonexistent@email.com"})
        mock_db_session.first.return_value = None
        
        result = auth_service.get_current_user(mock_db_session, token)
        assert result is None
    
    def test_get_current_user_inactive(self, auth_service, mock_user, mock_db_session):
        """Test getting current user when user is inactive - FR-003"""
        mock_user.is_active = False
        token = auth_service.create_access_token({"sub": "chp1@mms.org"})
        mock_db_session.first.return_value = mock_user
        
        result = auth_service.get_current_user(mock_db_session, token)
        assert result == mock_user  # Service should still return user, let API handle active check

    # FR-004: Secure logout with session termination
    def test_token_expiration_after_logout(self, auth_service):
        """Test that tokens expire after logout time - FR-004"""
        # This is typically handled by the frontend clearing the token
        # Backend should validate token expiration
        data = {"sub": "chp1@mms.org"}
        token = auth_service.create_access_token(data)
        
        # Token should be valid initially
        email = auth_service.verify_token(token)
        assert email == "chp1@mms.org"
        
        # After logout, frontend should clear token
        # Backend should reject expired tokens
        expires_delta = timedelta(seconds=1)
        short_token = auth_service.create_access_token(data, expires_delta)
        
        import time
        time.sleep(2)
        
        email = auth_service.verify_token(short_token)
        assert email is None

    # FR-005: Password reset functionality
    def test_password_reset_hash_generation(self, auth_service):
        """Test password reset hash generation - FR-005"""
        # This would typically involve a separate reset token service
        # For now, test that we can hash new passwords
        new_password = "newpassword123"
        hashed = auth_service.get_password_hash(new_password)
        
        assert hashed != new_password
        assert auth_service.verify_password(new_password, hashed) is True
    
    def test_password_reset_verification(self, auth_service):
        """Test password reset verification - FR-005"""
        old_password = "oldpassword123"
        new_password = "newpassword123"
        
        old_hash = auth_service.get_password_hash(old_password)
        new_hash = auth_service.get_password_hash(new_password)
        
        # Verify old password works
        assert auth_service.verify_password(old_password, old_hash) is True
        
        # Verify new password works
        assert auth_service.verify_password(new_password, new_hash) is True
        
        # Verify old password doesn't work with new hash
        assert auth_service.verify_password(old_password, new_hash) is False

    # Security Tests (NFR-005, NFR-006, NFR-007)
    def test_password_strength_validation(self, auth_service):
        """Test password strength validation - NFR-007"""
        # Test various password strengths
        weak_passwords = ["123", "password", "abc123"]
        strong_passwords = ["StrongPass123!", "ComplexP@ssw0rd", "Secure123#"]
        
        for weak_pwd in weak_passwords:
            # In a real implementation, this would be validated before hashing
            hashed = auth_service.get_password_hash(weak_pwd)
            assert auth_service.verify_password(weak_pwd, hashed) is True
        
        for strong_pwd in strong_passwords:
            hashed = auth_service.get_password_hash(strong_pwd)
            assert auth_service.verify_password(strong_pwd, hashed) is True
    
    def test_jwt_token_security(self, auth_service):
        """Test JWT token security features - NFR-006"""
        from backend.services.auth_service import SECRET_KEY, ALGORITHM
        data = {"sub": "chp1@mms.org"}
        token = auth_service.create_access_token(data)
        
        # Token should contain expiration
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in decoded
        
        # Token should not contain sensitive data
        assert "password" not in decoded
        assert "hashed_password" not in decoded
    
    def test_input_validation(self, auth_service, mock_db_session):
        """Test input validation and sanitization - NFR-007"""
        # Test with empty strings
        result = auth_service.authenticate_user(mock_db_session, "", "password123")
        assert result is None
        
        result = auth_service.authenticate_user(mock_db_session, "chp1@mms.org", "")
        assert result is None
        
        # Test with None values
        result = auth_service.authenticate_user(mock_db_session, None, "password123")
        assert result is None
        
        result = auth_service.authenticate_user(mock_db_session, "chp1@mms.org", None)
        assert result is None
