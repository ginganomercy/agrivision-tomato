from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
from PIL import Image
import io
import sys
import os
from typing import Dict, Any

# Ensure root directory is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.application.inference_service import InferenceService
from src.infrastructure.snowflake import generate_snowflake_id, generate_trace_id
from src.presentation.templates import render_portal_html, render_swagger_docs_html

# Security & Validation Constants (Production Hardening)
MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 Megabytes
ALLOWED_IMAGE_MIME_TYPES: tuple = ("image/jpeg", "image/png", "image/webp")

# Model File Configuration
BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
DEFAULT_MODEL_PATH: str = os.path.join(BASE_DIR, "data", "best_model.pth")
DEFAULT_REMEDIES_PATH: str = os.path.join(BASE_DIR, "data", "remedies.json")

MODEL_PATH: str = os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
REMEDIES_PATH: str = os.getenv("REMEDIES_PATH", DEFAULT_REMEDIES_PATH)
HF_REPO: str = os.getenv("HF_REPO", "ginganomercy/agrivision-mobilenetv2")

# Global ML Service Registry
ml_service: Dict[str, Any] = {}


def create_error_envelope(code: str, message: str, trace_id: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """Helper to enforce strict, standardized API error responses."""
    return {
        "error": {
            "code": code,
            "message": message,
            "trace_id": trace_id,
            "details": details or {}
        }
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for preloading PyTorch model into CPU memory once at container boot."""
    print("[BOOT] Memuat Model PyTorch ke dalam memori...")
    ml_service["inference"] = InferenceService(
        model_path=MODEL_PATH,
        remedies_path=REMEDIES_PATH,
        hf_repo_id=HF_REPO
    )
    yield
    print("[SHUTDOWN] Membersihkan resource model...")
    ml_service.clear()


app = FastAPI(
    title="AgriVision API",
    description="Production-grade API untuk deteksi penyakit daun tomat berbasis MobileNetV2.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    trace_id = generate_trace_id()
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "RESOURCE_NOT_FOUND"
    elif exc.status_code == 405:
        code = "METHOD_NOT_ALLOWED"
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_envelope(code=code, message=str(exc.detail), trace_id=trace_id)
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    trace_id = generate_trace_id()
    return JSONResponse(
        status_code=422,
        content=create_error_envelope(
            code="VALIDATION_FAILED",
            message="Payload request tidak valid.",
            trace_id=trace_id,
            details={"errors": exc.errors()}
        )
    )


@app.get("/", include_in_schema=False)
async def root_portal(request: Request):
    """
    Developer Portal & Live Leaf Disease Diagnostics Playground.
    Mendukung Content Negotiation (HTML untuk Browser, JSON untuk programmatic API client).
    """
    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header and "text/html" not in accept_header:
        return JSONResponse({
            "service": "AgriVision Tomato Disease Classifier API",
            "version": "1.0.0",
            "status": "online",
            "endpoints": {
                "health": "/health",
                "documentation": "/docs",
                "predict": "/v1/predict (POST)"
            }
        })
    return HTMLResponse(content=render_portal_html(), status_code=200)


@app.get("/docs", response_class=HTMLResponse, include_in_schema=False)
async def custom_swagger_docs():
    """Interactive Swagger UI Documentation dengan tema Modern Dark Glassmorphism."""
    return HTMLResponse(
        content=render_swagger_docs_html(title="AgriVision API Docs", openapi_url="/openapi.json"),
        status_code=200
    )


@app.get("/health")
async def health_check():
    """Liveness & Readiness probe untuk Docker Swarm & Ingress."""
    is_ready = "inference" in ml_service
    status_code = 200 if is_ready else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if is_ready else "degraded",
            "service": "agrivision-api",
            "model_ready": is_ready
        }
    )


@app.post("/v1/predict")
async def predict_leaf(file: UploadFile = File(...)):
    """
    Endpoint inferensi diagnosis penyakit daun tomat.
    Mengembalikan prediksi diagnosis, deskripsi, dan rekomendasi penanganan dengan Snowflake ID tracing.
    """
    trace_id = generate_trace_id()

    # 1. Validasi Content-Type (MIME)
    if not file.content_type or file.content_type.lower() not in ALLOWED_IMAGE_MIME_TYPES:
        return JSONResponse(
            status_code=400,
            content=create_error_envelope(
                code="INVALID_FILE_TYPE",
                message="File harus berupa gambar dengan format JPEG, PNG, atau WEBP.",
                trace_id=trace_id,
                details={"provided_content_type": file.content_type}
            )
        )

    # 2. Baca bytes payload dan validasi ukuran (DoS / OOM Guard)
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        return JSONResponse(
            status_code=413,
            content=create_error_envelope(
                code="FILE_TOO_LARGE",
                message=f"Ukuran file melebihi batas maksimal {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
                trace_id=trace_id,
                details={"file_size_bytes": len(contents), "max_bytes": MAX_FILE_SIZE_BYTES}
            )
        )

    if len(contents) == 0:
        return JSONResponse(
            status_code=400,
            content=create_error_envelope(
                code="EMPTY_FILE",
                message="File yang dikirimkan kosong (0 bytes).",
                trace_id=trace_id
            )
        )

    # 3. Validasi integritas format gambar menggunakan Pillow (Image Bomb Guard)
    try:
        verify_stream = io.BytesIO(contents)
        raw_img = Image.open(verify_stream)
        raw_img.verify()
        
        # Buka ulang stream untuk pemrosesan transformasi RGB
        process_stream = io.BytesIO(contents)
        image = Image.open(process_stream).convert('RGB')
    except Exception as img_err:
        return JSONResponse(
            status_code=400,
            content=create_error_envelope(
                code="CORRUPTED_IMAGE",
                message="File gambar corrupt atau format byte tidak valid.",
                trace_id=trace_id,
                details={"error_detail": str(img_err)}
            )
        )

    # 4. Eksekusi inferensi AI
    try:
        service: InferenceService = ml_service.get("inference")
        if not service:
            return JSONResponse(
                status_code=503,
                content=create_error_envelope(
                    code="SERVICE_UNAVAILABLE",
                    message="Model inference engine belum siap menerima request.",
                    trace_id=trace_id
                )
            )

        result = service.analyze_leaf(image)

        if result.get('status') == 'error':
            return JSONResponse(
                status_code=500,
                content=create_error_envelope(
                    code="INFERENCE_FAILED",
                    message=result.get('message', 'Gagal memproses inferensi gambar.'),
                    trace_id=trace_id
                )
            )

        # 5. Kembalikan respons sukses dengan Snowflake ID unik
        prediction_id = generate_snowflake_id()
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "trace_id": trace_id,
                "data": {
                    "prediction_id": prediction_id,
                    "diagnosis": result['name'],
                    "description": result['description'],
                    "recommendation": result['recommendation']
                }
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=create_error_envelope(
                code="INTERNAL_SERVER_ERROR",
                message="Terjadi kesalahan internal server saat menganalisis daun.",
                trace_id=trace_id,
                details={"error_detail": str(e)}
            )
        )
