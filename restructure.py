import os
import shutil

# Root directory
base_dir = os.path.abspath(os.path.dirname(__file__))

# Define new structure
folders_to_create = [
    "ml_training/src/infrastructure",
    "ml_training/data",
    "api_backend/src/presentation",
    "api_backend/src/application",
    "api_backend/src/domain",
    "api_backend/src/infrastructure",
    "api_backend/data"
]

for folder in folders_to_create:
    os.makedirs(os.path.join(base_dir, folder), exist_ok=True)

# Moves map: source -> destination
moves = {
    # ML Training Logic
    "src/infrastructure/train_production.py": "ml_training/src/infrastructure/",
    "src/infrastructure/download_dataset.py": "ml_training/src/infrastructure/",
    "src/infrastructure/push_to_hub.py": "ml_training/src/infrastructure/",
    "src/infrastructure/train_model.py": "ml_training/src/infrastructure/",
    "data/raw": "ml_training/data/",
    
    # API Backend Logic
    "src/presentation/api.py": "api_backend/src/presentation/",
    "src/presentation/app.py": "api_backend/src/presentation/",
    "src/application/inference_service.py": "api_backend/src/application/",
    "src/domain/disease_classifier.py": "api_backend/src/domain/",
    "src/infrastructure/model_loader.py": "api_backend/src/infrastructure/",
    "data/remedies.json": "api_backend/data/",
    
    # Docker configs
    "Dockerfile": "api_backend/",
    "docker-compose.yml": "api_backend/",
    "nginx.conf": "api_backend/"
}

print("Memulai restrukturisasi Monorepo...")
for src, dst in moves.items():
    src_path = os.path.join(base_dir, src)
    dst_path = os.path.join(base_dir, dst)
    
    if os.path.exists(src_path):
        try:
            shutil.move(src_path, dst_path)
            print(f"> Dipindahkan: {src} -> {dst}")
        except Exception as e:
            print(f"> Gagal memindahkan {src}: {e}")
    else:
        print(f"Lewati (file tidak ada): {src}")

# Split Requirements
req_path = os.path.join(base_dir, "requirements.txt")
if os.path.exists(req_path):
    shutil.copy(req_path, os.path.join(base_dir, "ml_training/requirements-train.txt"))
    shutil.copy(req_path, os.path.join(base_dir, "api_backend/requirements-serve.txt"))
    print("> Requirements dipisah menjadi train dan serve.")

print("Restrukturisasi selesai.")
