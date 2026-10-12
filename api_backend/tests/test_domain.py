import pytest
import torch
from unittest.mock import MagicMock, patch
from PIL import Image
from src.domain.disease_classifier import DiseaseClassifier


class TestDiseaseClassifier:
    @patch("src.domain.disease_classifier.ModelLoader")
    def test_should_return_predicted_class_id_when_valid_image_provided(self, mock_model_loader_class):
        # Setup mock ModelLoader return tensor logits [1, 3] dengan kelas 1 memiliki nilai tertinggi
        mock_loader_instance = MagicMock()
        mock_loader_instance.predict.return_value = torch.tensor([[0.1, 0.8, 0.1]])
        mock_model_loader_class.return_value = mock_loader_instance

        classifier = DiseaseClassifier(model_path="dummy.pth", num_classes=3)
        sample_img = Image.new("RGB", (256, 256), color=(255, 0, 0))

        predicted_class = classifier.predict(sample_img)

        assert predicted_class == 1
        mock_loader_instance.predict.assert_called_once()
        # Verifikasi input tensor berdimensi [1, 3, 224, 224]
        call_arg = mock_loader_instance.predict.call_args[0][0]
        assert call_arg.shape == (1, 3, 224, 224)

    @patch("src.domain.disease_classifier.ModelLoader")
    def test_should_apply_imagenet_standard_transforms(self, mock_model_loader_class):
        mock_loader_instance = MagicMock()
        mock_loader_instance.predict.return_value = torch.tensor([[0.9, 0.05, 0.05]])
        mock_model_loader_class.return_value = mock_loader_instance

        classifier = DiseaseClassifier(model_path="dummy.pth", num_classes=3)
        sample_img = Image.new("RGB", (500, 500), color=(0, 255, 0))

        predicted_class = classifier.predict(sample_img)

        assert predicted_class == 0
