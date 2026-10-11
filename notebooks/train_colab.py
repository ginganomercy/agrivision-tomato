"""
AgriVision — Production Deep Learning Training Script for Google Colab / Remote GPU
Pipeline:
1. Download PlantVillage Dataset (vipoooool/new-plant-diseases-dataset)
2. Filter 3 target classes: Tomato___Bacterial_spot, Tomato___Late_blight, Tomato___healthy
3. Augment data (Field/Farm Simulation)
4. Train MobileNetV2 Transfer Learning
5. Push best model checkpoint to Hugging Face Hub
"""

import os
import shutil
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from huggingface_hub import HfApi, login
import kagglehub

# ==========================================
# KONFIGURASI TRAINING & REPO
# ==========================================
TARGET_DATA_DIR = "./data/raw/tomato"
CLASSES = ["Tomato___Bacterial_spot", "Tomato___Late_blight", "Tomato___healthy"]
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001
BEST_MODEL_PATH = "best_model.pth"

# ==========================================
# 1. DOWNLOAD & FILTER DATASET
# ==========================================
def prepare_dataset():
    print("[INFO] Mengunduh dataset PlantVillage via kagglehub...")
    raw_path = kagglehub.dataset_download("vipoooool/new-plant-diseases-dataset")
    print(f"[INFO] Dataset tersimpan sementara di: {raw_path}")

    for c in CLASSES:
        os.makedirs(os.path.join(TARGET_DATA_DIR, c), exist_ok=True)

    print("[INFO] Memfilter 3 kelas tomat target...")
    for root, dirs, files in os.walk(raw_path):
        for d in dirs:
            if d in CLASSES:
                src_dir = os.path.join(root, d)
                dest_dir = os.path.join(TARGET_DATA_DIR, d)
                for f in os.listdir(src_dir):
                    if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                        shutil.copy(os.path.join(src_dir, f), os.path.join(dest_dir, f))

    for c in CLASSES:
        count = len(os.listdir(os.path.join(TARGET_DATA_DIR, c)))
        print(f"  - {c}: {count} gambar")

# ==========================================
# 2. TRAINING DEEP LEARNING (MOBILENETV2)
# ==========================================
def train_model():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Training device: {device}")

    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    full_dataset = datasets.ImageFolder(root=TARGET_DATA_DIR, transform=train_transform)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(full_dataset, [train_size, val_size])
    val_dataset.dataset.transform = val_transform

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    for param in model.parameters():
        param.requires_grad = False

    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, len(full_dataset.classes))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=LEARNING_RATE)

    best_acc = 0.0

    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print("-" * 20)

        model.train()
        running_loss, running_corrects = 0.0, 0
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

        train_loss = running_loss / len(train_loader.dataset)
        train_acc = running_corrects.double() / len(train_loader.dataset)

        model.eval()
        val_loss, val_corrects = 0.0, 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        val_loss = val_loss / len(val_loader.dataset)
        val_acc = val_corrects.double() / len(val_loader.dataset)

        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
        print(f"Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.4f}")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), BEST_MODEL_PATH)
            print(f">>> Model terbaik disimpan! (Acc: {best_acc:.4f}) <<<")

    return best_acc

# ==========================================
# 3. PUSH KE HUGGING FACE
# ==========================================
def push_to_huggingface(hf_token: str, repo_id: str, best_acc: float):
    print(f"\n[INFO] Mengunggah model ke Hugging Face Hub: {repo_id}")
    login(token=hf_token)
    api = HfApi()
    api.create_repo(repo_id=repo_id, private=False, exist_ok=True)
    api.upload_file(
        path_or_fileobj=BEST_MODEL_PATH,
        path_in_repo="best_model.pth",
        repo_id=repo_id,
        commit_message=f"Upload model AgriVision (Acc: {best_acc:.4f})"
    )
    print(f"[BERHASIL] Model telah live di: https://huggingface.co/{repo_id}")

if __name__ == "__main__":
    prepare_dataset()
    best_accuracy = train_model()
    
    # Masukkan Token dan Repo ID Anda:
    HF_TOKEN = os.environ.get("HF_TOKEN", "MASUKKAN_HF_WRITE_TOKEN_DISINI")
    REPO_ID = os.environ.get("HF_REPO", "ginganomercy/agrivision-mobilenetv2")
    
    if "MASUKKAN" not in HF_TOKEN:
        push_to_huggingface(HF_TOKEN, REPO_ID, best_accuracy)
    else:
        print("[WARNING] Token Hugging Face belum diatur. Silakan atur HF_TOKEN untuk upload.")
