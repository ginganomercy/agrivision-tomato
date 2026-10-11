import torch
from torchvision import transforms
from PIL import Image
import sys
import os

# Menambahkan root project ke sys.path agar import mudah
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.infrastructure.model_loader import ModelLoader

class DiseaseClassifier:
    def __init__(self, model_path: str, num_classes: int = 3, hf_repo_id: str = None):
        self.loader = ModelLoader(model_path, num_classes, hf_repo_id)
        
        # Transformasi standar standar ImageNet yang dibutuhkan MobileNetV2
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def predict(self, image: Image.Image) -> int:
        """Menerima PIL Image mentah dan mengembalikan ID kelas prediksi."""
        # 1. Pra-pemrosesan gambar
        img_t = self.transform(image)
        batch_t = torch.unsqueeze(img_t, 0) # Tambahkan dimensi batch
        
        # 2. Inferensi
        out = self.loader.predict(batch_t)
        
        # 3. Dapatkan kelas dengan probabilitas tertinggi
        _, predicted_class = torch.max(out, 1)
        return predicted_class.item()
