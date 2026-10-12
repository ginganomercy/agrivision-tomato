import pytest
from PIL import Image
import io
import sys
import os
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# Ensure api_backend root is available for imports
API_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if API_BACKEND_DIR not in sys.path:
    sys.path.insert(0, API_BACKEND_DIR)

from src.presentation.api import app, ml_service


@pytest.fixture
def sample_valid_image_bytes() -> bytes:
    """Menghasilkan byte array gambar JPEG sintetis yang valid (224x224 RGB)."""
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))  # Forest Green
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture
def sample_corrupted_image_bytes() -> bytes:
    """Menghasilkan byte array data rusak yang bukan gambar valid."""
    return b"PK\x03\x04ThisIsNotAValidJpegOrPngImageStreamHeader"


@pytest.fixture
def mock_inference_service():
    """Mock service inferensi untuk testing API tanpa dependensi bobot model raksasa."""
    mock = MagicMock()
    mock.analyze_leaf.return_value = {
        "status": "success",
        "name": "Bercak Daun Bakteri (Tomato___Bacterial_spot)",
        "description": "Infeksi bakteri pada daun tomat.",
        "recommendation": "Gunakan bakterisida berbasis tembaga."
    }
    return mock


@pytest.fixture
def client(mock_inference_service):
    """FastAPI TestClient yang disiapkan dengan mock inference service terdaftar."""
    with TestClient(app) as test_client:
        # Override mock service setelah lifespan boot selesai
        ml_service["inference"] = mock_inference_service
        yield test_client
    ml_service.clear()
