FROM python:3.10-slim

# Mencegah Python menulis file .pyc (menghemat ukuran image)
ENV PYTHONDONTWRITEBYTECODE=1
# Memaksa stdout/stderr tidak di-buffer agar log Docker real-time
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies yang dibutuhkan untuk memproses gambar
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency list
COPY requirements.txt .

# CRITICAL OPTIMIZATION: Instal PyTorch versi CPU-only. 
# Ini memangkas ukuran Docker Image sebesar ~2 GIGABYTE karena kita tidak perlu file CUDA NVIDIA di server CPU bare-metal.
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Instal dependencies aplikasi
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua source code
COPY . .

# Ekspos port default FastAPI
EXPOSE 8000

# Jalankan server
CMD ["uvicorn", "src.presentation.api:app", "--host", "0.0.0.0", "--port", "8000"]
