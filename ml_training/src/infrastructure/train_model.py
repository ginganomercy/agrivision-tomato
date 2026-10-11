import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader
import os

# Konfigurasi
DATA_DIR = '../data/raw' # Ganti dengan path dataset PlantVillage Anda
MODEL_SAVE_PATH = '../data/best_model.pth'
NUM_CLASSES = 3 # Misal: 0: Sehat, 1: Hawar, 2: Bercak
BATCH_SIZE = 32
EPOCHS = 5

def train_model():
    print("Mempersiapkan model MobileNetV2 (Transfer Learning)...")
    
    # 1. Load Pre-trained Model dari Torchvision (sangat ringan)
    # weights=models.MobileNet_V2_Weights.DEFAULT adalah cara modern memuat pre-trained weight
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    
    # 2. Freeze semua layer dasar agar tidak ikut dilatih (menghemat memori & waktu)
    for param in model.parameters():
        param.requires_grad = False
        
    # 3. Ganti 'kepala' (classifier) terakhir sesuai dengan jumlah kelas penyakit kita
    # MobileNetV2 classifier head adalah urutan [1] dari model.classifier
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, NUM_CLASSES)
    
    # Pastikan hanya layer classifier baru yang dilatih
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()
    
    print(f"Model siap! Classifier baru diatur untuk {NUM_CLASSES} kelas.")
    print("Pipeline pelatihan dasar siap dijalankan. (Tambahkan logika dataset di sini nanti)")
    
    # Simulasi menyimpan bobot model
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Bobot model awal berhasil disimpan di: {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    # Pastikan folder data ada
    os.makedirs('../data', exist_ok=True)
    train_model()
