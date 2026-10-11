import json
from PIL import Image
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.domain.disease_classifier import DiseaseClassifier

class InferenceService:
    def __init__(self, model_path: str, remedies_path: str, hf_repo_id: str = None):
        self.classifier = DiseaseClassifier(model_path=model_path, hf_repo_id=hf_repo_id)
        self.remedies = self._load_remedies(remedies_path)

    def _load_remedies(self, path: str) -> dict:
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error memuat file panduan: {e}")
            return {}

    def analyze_leaf(self, image: Image.Image) -> dict:
        """Mengorkestrasi klasifikasi daun dan mengambil saran penanganannya."""
        try:
            # 1. Panggil layer domain untuk mendapatkan ID penyakit
            class_id = self.classifier.predict(image)
            str_id = str(class_id)
            
            # 2. Petakan hasil ke saran penanganan (Remedy)
            if str_id in self.remedies:
                result = self.remedies[str_id]
                result['status'] = 'success'
                return result
            else:
                return {
                    'status': 'error',
                    'message': f'Kelas {class_id} tidak dikenali di database.'
                }
        except Exception as e:
             return {
                'status': 'error',
                'message': str(e)
            }
