import os
from PIL import Image
import numpy as np

def create_dataset_scaffolding():
    """
    Membuat struktur folder untuk dataset spesifik tomat dan 
    menghasilkan gambar sampel sintetik (dummy) agar pipeline 
    Deep Learning (DataLoader) dapat langsung diuji coba tanpa error.
    """
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/raw/tomato'))
    
    # Kelas spesifik yang dibutuhkan
    classes = [
        'Tomato___Bacterial_spot',
        'Tomato___Late_blight',
        'Tomato___healthy'
    ]
    
    print(f"Menyiapkan struktur direktori di: {base_dir}")
    
    # Buat direktori dan gambar sampel
    for cls in classes:
        class_dir = os.path.join(base_dir, cls)
        os.makedirs(class_dir, exist_ok=True)
        
        # Cek apakah folder sudah memiliki gambar (agar tidak menimpa dataset asli Anda)
        if len(os.listdir(class_dir)) == 0:
            print(f"Folder {cls} kosong. Membuat 5 gambar sampel sintetik...")
            
            for i in range(5):
                # Membuat gambar RGB sintetik berukuran 224x224
                # Warna dasar sedikit berbeda tiap kelas agar model ada yang dipelajari
                if 'healthy' in cls:
                    color_base = [0, 200, 0] # Hijau
                elif 'Bacterial' in cls:
                    color_base = [150, 150, 0] # Kuning kecoklatan
                else:
                    color_base = [100, 50, 0] # Coklat gelap (Hawar)
                    
                # Tambahkan noise acak agar terlihat seperti tekstur daun bagi komputer
                noise = np.random.randint(-30, 30, (224, 224, 3), dtype=np.int16)
                img_array = np.clip(color_base + noise, 0, 255).astype(np.uint8)
                
                img = Image.fromarray(img_array, 'RGB')
                img_path = os.path.join(class_dir, f'sample_{i}.jpg')
                img.save(img_path)
        else:
            print(f"Folder {cls} sudah berisi data. Melewati pembuatan gambar sintetik.")
            
    print("\n[SUCCESS] Struktur dataset spesifik berhasil disiapkan!")
    print("[INFO] TIPS: Jika Anda sudah mengunduh dataset PlantVillage yang asli, hapus gambar 'sample_x.jpg' ini dan letakkan gambar asli Anda ke dalam folder-folder tersebut.")

if __name__ == "__main__":
    create_dataset_scaffolding()
