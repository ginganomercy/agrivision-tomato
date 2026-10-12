import json
import pytest
from unittest.mock import MagicMock, patch, mock_open
from PIL import Image
from src.application.inference_service import InferenceService


class TestInferenceService:
    @pytest.fixture
    def mock_remedies_data(self):
        return {
            "0": {
                "name": "Bercak Daun Bakteri",
                "description": "Infeksi bakteri",
                "recommendation": "Gunakan tembaga"
            },
            "1": {
                "name": "Hawar Daun",
                "description": "Infeksi jamur",
                "recommendation": "Gunakan fungisida"
            }
        }

    @patch("src.application.inference_service.DiseaseClassifier")
    def test_should_return_success_and_correct_remedy_when_known_class_predicted(self, mock_classifier_cls, mock_remedies_data):
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.predict.return_value = 0
        mock_classifier_cls.return_value = mock_classifier_instance

        with patch("builtins.open", mock_open(read_data=json.dumps(mock_remedies_data))):
            service = InferenceService("dummy_model.pth", "dummy_remedies.json")
            sample_image = Image.new("RGB", (100, 100))
            result = service.analyze_leaf(sample_image)

        assert result["status"] == "success"
        assert result["name"] == "Bercak Daun Bakteri"
        assert result["recommendation"] == "Gunakan tembaga"

    @patch("src.application.inference_service.DiseaseClassifier")
    def test_should_return_error_status_when_class_id_not_in_remedies(self, mock_classifier_cls, mock_remedies_data):
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.predict.return_value = 99  # Kelas tidak terdaftar
        mock_classifier_cls.return_value = mock_classifier_instance

        with patch("builtins.open", mock_open(read_data=json.dumps(mock_remedies_data))):
            service = InferenceService("dummy_model.pth", "dummy_remedies.json")
            sample_image = Image.new("RGB", (100, 100))
            result = service.analyze_leaf(sample_image)

        assert result["status"] == "error"
        assert "tidak dikenali" in result["message"]

    @patch("src.application.inference_service.DiseaseClassifier")
    def test_should_handle_missing_remedies_file_gracefully(self, mock_classifier_cls):
        mock_classifier_instance = MagicMock()
        mock_classifier_instance.predict.return_value = 0
        mock_classifier_cls.return_value = mock_classifier_instance

        # Load file yang tidak eksis
        service = InferenceService("dummy_model.pth", "non_existent_remedies.json")
        sample_image = Image.new("RGB", (100, 100))
        result = service.analyze_leaf(sample_image)

        assert result["status"] == "error"
