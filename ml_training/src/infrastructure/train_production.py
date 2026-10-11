import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader
import os
import time

# ==========================================
# KONFIGURASI DATASET SPESIFIK (TOMAT)
# ==========================================
# Pastikan dataset berada di folder ini dengan struktur:
# data/raw/tomato/
# ├── Tomato___Bacterial_spot/
# ├── Tomato___Late_blight/
# └── Tomato___healthy/
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/raw/tomato'))
MODEL_SAVE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/best_model.pth'))

# 3 Kelas spesifik yang kita analisis
NUM_CLASSES = 3 
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001

def get_data_loaders():
    """Menyiapkan Pipeline Data Augmentation (Deep Learning)"""
    
    # Augmentasi Agresif untuk Pelatihan (Mensimulasikan kondisi sawah asli)
    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224), # Potong acak, ubah skala
        transforms.RandomHorizontalFlip(), # Putar kiri-kanan
        transforms.RandomRotation(20),     # Putar kemiringan
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2), # Ubah cahaya
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Transformasi murni untuk Evaluasi (Validasi)
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    print(f"Mencari dataset spesifik di: {DATA_DIR}")
    if not os.path.exists(DATA_DIR):
        raise FileNotFoundError(f"Folder dataset tidak ditemukan! Harap ekstrak dataset Tomat ke {DATA_DIR}")

    # Memuat dataset (Diasumsikan folder sudah dibagi train/val. Jika tidak, ini mengambil semuanya)
    full_dataset = datasets.ImageFolder(root=DATA_DIR, transform=train_transform)
    
    # Membagi 80% Train, 20% Validation
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(full_dataset, [train_size, val_size])
    
    # Timpa transform untuk validasi (karena random_split menggunakan transform yang sama)
    # Ini trik tingkat lanjut di PyTorch agar validasi tidak kena augmentasi acak
    val_dataset.dataset.transform = val_transform

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
    
    return train_loader, val_loader, full_dataset.classes

def train_production_model():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Menggunakan perangkat keras: {device}")

    try:
        train_loader, val_loader, class_names = get_data_loaders()
        print(f"Dataset berhasil dimuat. Kelas yang dideteksi: {class_names}")
    except FileNotFoundError as e:
        print(e)
        return

    # 1. Load Arsitektur Deep Learning (MobileNetV2)
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    
    # 2. Freeze fitur konvolusi (Transfer Learning)
    for param in model.parameters():
        param.requires_grad = False
        
    # 3. Ganti lapisan klasifikasi terakhir untuk dataset spesifik kita
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, len(class_names))
    model = model.to(device)
    
    # 4. Kriteria Loss dan Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=LEARNING_RATE)

    # 5. Loop Pelatihan Deep Learning (Epochs)
    best_acc = 0.0
    
    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print("-" * 10)
        
        # Mode Pelatihan
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = running_corrects.double() / len(train_loader.dataset)
        print(f"Train Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f}")
        
        # Mode Evaluasi
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)
                
        val_epoch_loss = val_loss / len(val_loader.dataset)
        val_epoch_acc = val_corrects.double() / len(val_loader.dataset)
        print(f"Val Loss: {val_epoch_loss:.4f} | Acc: {val_epoch_acc:.4f}")
        
        # Simpan model terbaik
        if val_epoch_acc > best_acc:
            best_acc = val_epoch_acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(">>> Model terbaik baru disimpan! <<<")

if __name__ == '__main__':
    train_production_model()
