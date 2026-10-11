import os
from huggingface_hub import hf_hub_download
import torch
from torchvision import models
import torch.nn as nn

class ModelLoader:
    def __init__(self, model_path: str, num_classes: int = 3, hf_repo_id: str = None):
        self.model_path = model_path
        self.num_classes = num_classes
        self.hf_repo_id = hf_repo_id
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self._load_model()
        
    def _download_from_hf(self):
        """Mengunduh model dari Hugging Face Hub jika file lokal tidak ada."""
        print(f"Mencari model lokal di {self.model_path}...")
        if not os.path.exists(self.model_path):
            if self.hf_repo_id:
                print(f"Model lokal tidak ditemukan. Mengunduh dari Hugging Face: {self.hf_repo_id}...")
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                downloaded_path = hf_hub_download(repo_id=self.hf_repo_id, filename="best_model.pth", local_dir=os.path.dirname(self.model_path))
                print(f"Berhasil diunduh ke: {downloaded_path}")
            else:
                print(f"WARNING: File lokal tidak ada dan hf_repo_id tidak di-set. Akan menggunakan bobot acak!")

    def _load_model(self):
        self._download_from_hf()
        
        print(f"Memuat model di device: {self.device}")
        model = models.mobilenet_v2()
        
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, self.num_classes)
        
        if os.path.exists(self.model_path):
            state_dict = torch.load(self.model_path, map_location=self.device)
            model.load_state_dict(state_dict)
            print("Bobot model berhasil dimuat ke arsitektur.")
            
        model.to(self.device)
        model.eval()
        return model

    def predict(self, input_tensor: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            input_tensor = input_tensor.to(self.device)
            outputs = self.model(input_tensor)
            return outputs
