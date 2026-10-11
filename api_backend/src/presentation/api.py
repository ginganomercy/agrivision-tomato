from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from PIL import Image
import io
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.application.inference_service import InferenceService

# Konfigurasi Model
MODEL_PATH = 'data/best_model.pth'
REMEDIES_PATH = 'data/remedies.json'

# Global Service
ml_service = {}
HF_REPO = os.getenv("HF_REPO", "ginganomercy/agrivision-mobilenetv2")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dijalankan saat server START (Memuat model 1 kali ke memori)
    print("Memuat Model PyTorch ke dalam memori...")
    ml_service["inference"] = InferenceService(
        model_path=MODEL_PATH, 
        remedies_path=REMEDIES_PATH,
        hf_repo_id=HF_REPO
    )
    yield
    # Dijalankan saat server SHUTDOWN (Membersihkan memori)
    ml_service.clear()

app = FastAPI(
    title="AgriVision API",
    description="Production API untuk klasifikasi penyakit daun.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS: Mengizinkan request dari web/mobile mana pun
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Endpoint untuk Load Balancer dan Docker Healthcheck"""
    return {"status": "ok", "message": "API siap menerima request."}

@app.post("/v1/predict")
async def predict_leaf(file: UploadFile = File(...)):
    """Menerima file gambar dan mengembalikan diagnosis & saran (JSON)."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar (JPG/PNG).")
    
    try:
        # Membaca gambar dari RAM (tanpa menyimpan ke harddisk bare-metal)
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Eksekusi AI
        result = ml_service["inference"].analyze_leaf(image)
        
        if result['status'] == 'error':
            raise HTTPException(status_code=500, detail=result['message'])
            
        return JSONResponse(content={
            "success": True,
            "data": {
                "diagnosis": result['name'],
                "description": result['description'],
                "recommendation": result['recommendation']
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan pemrosesan: {str(e)}")
