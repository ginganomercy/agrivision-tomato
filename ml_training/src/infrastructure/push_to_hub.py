import os
from huggingface_hub import HfApi, login

def push_model_to_hf(repo_id: str, model_path: str, token: str = None):
    """Mengunggah model PyTorch lokal ke Hugging Face Hub"""
    print("Memulai proses upload ke Hugging Face...")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model lokal {model_path} tidak ditemukan! Latih model dulu.")
        
    # Login menggunakan token (bisa via parameter atau environment variable HF_TOKEN)
    if token:
        login(token=token)
    
    api = HfApi()
    
    # Membuat repositori baru jika belum ada
    try:
        api.create_repo(repo_id=repo_id, private=False, exist_ok=True)
        print(f"Repositori '{repo_id}' siap.")
    except Exception as e:
        print(f"Gagal memeriksa repositori: {e}")
        
    # Mengunggah file
    print(f"Mengunggah {model_path}...")
    api.upload_file(
        path_or_fileobj=model_path,
        path_in_repo="best_model.pth",
        repo_id=repo_id,
        commit_message="Update model AgriVision terbaru"
    )
    
    print(f"[SUCCESS] Berhasil! Model Anda sekarang live di: https://huggingface.co/{repo_id}")

if __name__ == "__main__":
    REPO_ID = os.getenv("HF_REPO", "ginganomercy/agrivision-mobilenetv2") 
    MODEL_PATH = "../../data/best_model.pth"
    
    # Token bisa dimasukkan ke environment variable di sistem Anda (opsional tapi disarankan)
    # HUGGING_FACE_TOKEN = os.environ.get("HF_TOKEN")
    
    push_model_to_hf(
        repo_id=REPO_ID, 
        model_path=os.path.abspath(os.path.join(os.path.dirname(__file__), MODEL_PATH))
    )
