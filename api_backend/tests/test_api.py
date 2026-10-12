import pytest
from src.presentation.api import ml_service, MAX_FILE_SIZE_BYTES


class TestApiEndpoints:
    def test_should_return_html_portal_when_browser_accesses_root(self, client):
        response = client.get("/", headers={"accept": "text/html,application/xhtml+xml"})
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "AgriVision AI" in response.text
        assert "Tomato Leaf Disease" in response.text

    def test_should_return_json_when_api_client_accesses_root(self, client):
        response = client.get("/", headers={"accept": "application/json"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "endpoints" in data

    def test_should_return_custom_dark_swagger_docs(self, client):
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "swagger-ui" in response.text
        assert "Outfit" in response.text

    def test_should_return_healthy_status_when_health_endpoint_called(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["model_ready"] is True

    def test_should_return_degraded_status_when_model_service_not_loaded(self, client):
        ml_service.clear()  # Simulasikan model belum di-load
        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["model_ready"] is False

    def test_should_diagnose_leaf_successfully_when_valid_image_uploaded(self, client, sample_valid_image_bytes):
        response = client.post(
            "/v1/predict",
            files={"file": ("leaf.jpg", sample_valid_image_bytes, "image/jpeg")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "trace_id" in data
        assert data["trace_id"].startswith("trc-")

        inner_data = data["data"]
        assert "prediction_id" in inner_data
        assert inner_data["prediction_id"].isdigit()
        assert "diagnosis" in inner_data
        assert "recommendation" in inner_data

    def test_should_reject_with_400_when_content_type_is_not_image(self, client):
        response = client.post(
            "/v1/predict",
            files={"file": ("document.pdf", b"%PDF-1.4...", "application/pdf")}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "INVALID_FILE_TYPE"

    def test_should_reject_with_400_when_file_is_empty(self, client):
        response = client.post(
            "/v1/predict",
            files={"file": ("empty.jpg", b"", "image/jpeg")}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "EMPTY_FILE"

    def test_should_reject_with_400_when_image_is_corrupted(self, client, sample_corrupted_image_bytes):
        response = client.post(
            "/v1/predict",
            files={"file": ("corrupt.png", sample_corrupted_image_bytes, "image/png")}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "CORRUPTED_IMAGE"

    def test_should_reject_with_413_when_payload_exceeds_size_limit(self, client):
        oversized_bytes = b"0" * (MAX_FILE_SIZE_BYTES + 1024)
        response = client.post(
            "/v1/predict",
            files={"file": ("huge.jpg", oversized_bytes, "image/jpeg")}
        )
        assert response.status_code == 413
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "FILE_TOO_LARGE"

    def test_should_return_standard_error_envelope_when_404_encountered(self, client):
        response = client.get("/v1/invalid-route")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
        assert "trace_id" in data["error"]
