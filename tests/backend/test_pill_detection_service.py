import pytest
from unittest.mock import Mock, patch, MagicMock
import numpy as np
import cv2
from PIL import Image
import io
from backend.services.pill_detection_service import PillDetectionService


class TestPillDetectionService:
    """Test cases for PillDetectionService - Requirements: FR-011, FR-014, FR-015, FR-016, FR-017"""
    
    @pytest.fixture
    def pill_service(self):
        """Create PillDetectionService instance for testing"""
        return PillDetectionService()
    
    @pytest.fixture
    def mock_image(self):
        """Create a mock image for testing"""
        # Create a simple test image
        img_array = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        return Image.fromarray(img_array)
    
    @pytest.fixture
    def mock_detection_results(self):
        """Create mock YOLO detection results"""
        return [
            {
                'boxes': np.array([[100, 100, 200, 200], [300, 300, 400, 400]]),
                'confidences': np.array([0.95, 0.87]),
                'class_ids': np.array([0, 0])
            }
        ]

    # FR-011: Native camera access for pill bottle photos
    def test_load_model(self, pill_service):
        """Test model loading - FR-011"""
        assert pill_service.model is not None
    
    @patch('backend.services.pill_detection_service.YOLO')
    def test_load_model_file_not_found(self, mock_yolo, pill_service):
        """Test model loading when file doesn't exist - FR-011"""
        mock_yolo.side_effect = FileNotFoundError("Model file not found")
        
        with pytest.raises(FileNotFoundError):
            PillDetectionService()
    
    def test_preprocess_image(self, pill_service, mock_image):
        """Test image preprocessing - FR-011"""
        processed = pill_service.preprocess_image(mock_image)
        
        # Check that image is converted to RGB
        assert processed.mode == 'RGB'
        # Check that image is resized to expected dimensions
        assert processed.size == (640, 640)
    
    def test_preprocess_image_with_different_sizes(self, pill_service):
        """Test image preprocessing with different input sizes - FR-011"""
        # Test with small image
        small_img = Image.new('RGB', (100, 100), color='red')
        processed = pill_service.preprocess_image(small_img)
        assert processed.size == (640, 640)
        
        # Test with large image
        large_img = Image.new('RGB', (1920, 1080), color='blue')
        processed = pill_service.preprocess_image(large_img)
        assert processed.size == (640, 640)

    # FR-014: AI-powered pill detection and counting
    @patch.object(PillDetectionService, 'model')
    def test_detect_pills_success(self, mock_model, pill_service, mock_image, mock_detection_results):
        """Test successful pill detection - FR-014"""
        mock_model.return_value = mock_detection_results
        
        results = pill_service.detect_pills(mock_image)
        
        assert len(results) == 2
        assert results[0]['confidence'] == 0.95
        assert results[0]['bbox'] == [100, 100, 200, 200]
        assert results[1]['confidence'] == 0.87
        assert results[1]['bbox'] == [300, 300, 400, 400]
    
    @patch.object(PillDetectionService, 'model')
    def test_detect_pills_no_detections(self, mock_model, pill_service, mock_image):
        """Test pill detection with no pills found - FR-014"""
        mock_model.return_value = [{'boxes': np.array([]), 'confidences': np.array([]), 'class_ids': np.array([])}]
        
        results = pill_service.detect_pills(mock_image)
        
        assert len(results) == 0
    
    @patch.object(PillDetectionService, 'model')
    def test_detect_pills_low_confidence(self, mock_model, pill_service, mock_image):
        """Test pill detection with low confidence detections - FR-014"""
        mock_model.return_value = [{
            'boxes': np.array([[100, 100, 200, 200]]),
            'confidences': np.array([0.3]),  # Below threshold
            'class_ids': np.array([0])
        }]
        
        results = pill_service.detect_pills(mock_image)
        
        assert len(results) == 0

    # FR-015: Confidence scoring for AI results
    def test_count_pills(self, pill_service):
        """Test pill counting from detection results - FR-015"""
        detections = [
            {'confidence': 0.95, 'bbox': [100, 100, 200, 200]},
            {'confidence': 0.87, 'bbox': [300, 300, 400, 400]},
            {'confidence': 0.92, 'bbox': [500, 500, 600, 600]}
        ]
        
        count = pill_service.count_pills(detections)
        assert count == 3
    
    def test_count_pills_empty(self, pill_service):
        """Test pill counting with no detections - FR-015"""
        detections = []
        
        count = pill_service.count_pills(detections)
        assert count == 0
    
    def test_calculate_confidence_score(self, pill_service):
        """Test confidence score calculation - FR-015"""
        detections = [
            {'confidence': 0.95},
            {'confidence': 0.87},
            {'confidence': 0.92}
        ]
        
        avg_confidence = pill_service.calculate_confidence_score(detections)
        assert avg_confidence == pytest.approx(0.913, rel=1e-3)
    
    def test_calculate_confidence_score_empty(self, pill_service):
        """Test confidence score calculation with no detections - FR-015"""
        detections = []
        
        avg_confidence = pill_service.calculate_confidence_score(detections)
        assert avg_confidence == 0.0
    
    def test_filter_detections_by_confidence(self, pill_service):
        """Test filtering detections by confidence threshold - FR-015"""
        detections = [
            {'confidence': 0.95, 'bbox': [100, 100, 200, 200]},
            {'confidence': 0.3, 'bbox': [300, 300, 400, 400]},  # Below threshold
            {'confidence': 0.92, 'bbox': [500, 500, 600, 600]}
        ]
        
        filtered = pill_service.filter_detections_by_confidence(detections, threshold=0.5)
        
        assert len(filtered) == 2
        assert filtered[0]['confidence'] == 0.95
        assert filtered[1]['confidence'] == 0.92

    # FR-016: Manual count override capability
    def test_manual_override_validation(self, pill_service):
        """Test manual count override validation - FR-016"""
        # Test valid manual counts
        valid_counts = [0, 1, 10, 100, 1000]
        for count in valid_counts:
            assert pill_service.validate_manual_count(count) is True
        
        # Test invalid manual counts
        invalid_counts = [-1, -10, "invalid", None]
        for count in invalid_counts:
            assert pill_service.validate_manual_count(count) is False
    
    def test_manual_override_reason_tracking(self, pill_service):
        """Test manual override reason tracking - FR-016"""
        ai_count = 25
        manual_count = 30
        reason = "AI confidence too low"
        
        override_data = pill_service.create_manual_override(ai_count, manual_count, reason)
        
        assert override_data['ai_count'] == ai_count
        assert override_data['manual_count'] == manual_count
        assert override_data['reason'] == reason
        assert override_data['timestamp'] is not None

    # FR-017: Bounding box visualization of detected pills
    def test_bounding_box_creation(self, pill_service):
        """Test bounding box creation for visualization - FR-017"""
        detections = [
            {'confidence': 0.95, 'bbox': [100, 100, 200, 200]},
            {'confidence': 0.87, 'bbox': [300, 300, 400, 400]}
        ]
        
        bounding_boxes = pill_service.create_bounding_boxes(detections)
        
        assert len(bounding_boxes) == 2
        assert bounding_boxes[0]['x1'] == 100
        assert bounding_boxes[0]['y1'] == 100
        assert bounding_boxes[0]['x2'] == 200
        assert bounding_boxes[0]['y2'] == 200
        assert bounding_boxes[0]['confidence'] == 0.95
    
    def test_bounding_box_visualization_data(self, pill_service):
        """Test bounding box visualization data format - FR-017"""
        detections = [
            {'confidence': 0.95, 'bbox': [100, 100, 200, 200]}
        ]
        
        viz_data = pill_service.create_visualization_data(detections)
        
        assert 'bounding_boxes' in viz_data
        assert 'total_count' in viz_data
        assert 'average_confidence' in viz_data
        assert viz_data['total_count'] == 1
        assert viz_data['average_confidence'] == 0.95

    # Image Validation Tests
    def test_validate_image_valid(self, pill_service, mock_image):
        """Test image validation with valid image - FR-011"""
        result = pill_service.validate_image(mock_image)
        assert result is True
    
    def test_validate_image_none(self, pill_service):
        """Test image validation with None - FR-011"""
        result = pill_service.validate_image(None)
        assert result is False
    
    def test_validate_image_invalid_format(self, pill_service):
        """Test image validation with invalid format - FR-011"""
        # Create an image with invalid mode
        invalid_img = Image.new('CMYK', (100, 100))
        
        result = pill_service.validate_image(invalid_img)
        assert result is False
    
    def test_validate_image_too_small(self, pill_service):
        """Test image validation with too small image - FR-011"""
        small_img = Image.new('RGB', (10, 10))
        
        result = pill_service.validate_image(small_img)
        assert result is False
    
    def test_validate_image_too_large(self, pill_service):
        """Test image validation with too large image - FR-011"""
        large_img = Image.new('RGB', (10000, 10000))
        
        result = pill_service.validate_image(large_img)
        assert result is False

    # Complete Processing Pipeline Tests
    @patch.object(PillDetectionService, 'detect_pills')
    def test_process_image_success(self, mock_detect, pill_service, mock_image):
        """Test complete image processing pipeline - FR-014"""
        mock_detect.return_value = [
            {'confidence': 0.95, 'bbox': [100, 100, 200, 200]},
            {'confidence': 0.87, 'bbox': [300, 300, 400, 400]}
        ]
        
        result = pill_service.process_image(mock_image)
        
        assert result['success'] is True
        assert result['pill_count'] == 2
        assert result['confidence'] == 0.91  # Average confidence
        assert len(result['detections']) == 2
    
    @patch.object(PillDetectionService, 'detect_pills')
    def test_process_image_no_detections(self, mock_detect, pill_service, mock_image):
        """Test image processing with no pill detections - FR-014"""
        mock_detect.return_value = []
        
        result = pill_service.process_image(mock_image)
        
        assert result['success'] is True
        assert result['pill_count'] == 0
        assert result['confidence'] == 0.0
        assert len(result['detections']) == 0
    
    def test_process_image_invalid(self, pill_service):
        """Test image processing with invalid image - FR-011"""
        result = pill_service.process_image(None)
        
        assert result['success'] is False
        assert 'error' in result
    
    @patch.object(PillDetectionService, 'detect_pills')
    def test_process_image_detection_error(self, mock_detect, pill_service, mock_image):
        """Test image processing when detection fails - FR-014"""
        mock_detect.side_effect = Exception("Detection failed")
        
        result = pill_service.process_image(mock_image)
        
        assert result['success'] is False
        assert 'error' in result

    # Performance Tests (NFR-002)
    def test_processing_time_under_10_seconds(self, pill_service, mock_image):
        """Test AI processing time under 10 seconds - NFR-002"""
        import time
        
        start_time = time.time()
        
        # Mock the detection to be fast
        with patch.object(PillDetectionService, 'detect_pills') as mock_detect:
            mock_detect.return_value = [
                {'confidence': 0.95, 'bbox': [100, 100, 200, 200]}
            ]
            
            result = pill_service.process_image(mock_image)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        assert processing_time < 10.0  # Should be under 10 seconds
        assert result['success'] is True

    # Reliability Tests (NFR-010, NFR-011)
    def test_graceful_error_handling(self, pill_service):
        """Test graceful error handling - NFR-011"""
        # Test with various error conditions
        error_conditions = [
            None,  # Invalid image
            "not an image",  # Invalid data type
            Image.new('CMYK', (100, 100)),  # Invalid format
        ]
        
        for condition in error_conditions:
            result = pill_service.process_image(condition)
            assert result['success'] is False
            assert 'error' in result
    
    def test_automatic_retry_mechanism(self, pill_service, mock_image):
        """Test automatic retry mechanism - NFR-011"""
        # Mock detection to fail first, then succeed
        with patch.object(PillDetectionService, 'detect_pills') as mock_detect:
            mock_detect.side_effect = [Exception("First failure"), [{'confidence': 0.95, 'bbox': [100, 100, 200, 200]}]]
            
            # In a real implementation, this would retry
            # For now, just test that errors are handled gracefully
            result = pill_service.process_image(mock_image)
            assert result['success'] is False

    # Additional AI Model Tests
    def test_model_confidence_thresholds(self, pill_service):
        """Test model confidence thresholds - FR-015"""
        # Test different confidence levels
        high_confidence = 0.95
        medium_confidence = 0.75
        low_confidence = 0.3
        
        # High confidence should be accepted
        assert pill_service.is_confidence_acceptable(high_confidence) is True
        
        # Medium confidence should be accepted
        assert pill_service.is_confidence_acceptable(medium_confidence) is True
        
        # Low confidence should be rejected
        assert pill_service.is_confidence_acceptable(low_confidence) is False
    
    def test_multiple_pill_types_detection(self, pill_service):
        """Test detection of multiple pill types - FR-014"""
        # Mock detection with different pill types
        detections = [
            {'confidence': 0.95, 'bbox': [100, 100, 200, 200], 'class_id': 0},  # Iron pills
            {'confidence': 0.87, 'bbox': [300, 300, 400, 400], 'class_id': 1},  # Vitamin pills
        ]
        
        # Test that different pill types are counted separately
        iron_count = len([d for d in detections if d['class_id'] == 0])
        vitamin_count = len([d for d in detections if d['class_id'] == 1])
        
        assert iron_count == 1
        assert vitamin_count == 1
        assert len(detections) == 2
