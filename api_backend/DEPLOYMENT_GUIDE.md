# 🚀 Panduan Deployment Bare-Metal: AgriVision (Docker Swarm + Nginx)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan deployment sistem **AgriVision** di server bare-metal menggunakan **Docker Swarm** (3 replika API) dan **Nginx Reverse Proxy & Load Balancer**.

Model AI ditarik secara otomatis dari Hugging Face Hub:
👉 `https://huggingface.co/ginganomercy/agrivision-mobilenetv2`

---

## 📋 Prasyarat Server Bare-Metal
Pastikan server bare-metal (Ubuntu/Debian/CentOS) Anda telah terpasang:
- **Docker Engine** (v20.10 ke atas)
- Akses port `80` (HTTP) dibuka di firewall (`ufw allow 80/tcp`)

---

## 🛠️ Langkah-Langkah Deployment

### 1. Salin Folder `api_backend` ke Server
Salin seluruh isi folder `api_backend` ke server bare-metal Anda, misalnya ke direktori `/opt/agrivision`:
```bash
# Contoh jika menggunakan SCP dari laptop Anda:
scp -r api_backend user@ip-server-anda:/opt/agrivision
```

Masuk ke direktori project di server:
```bash
cd /opt/agrivision
```

---

### 2. Inisialisasi Docker Swarm (Jika Belum Aktif)
Aktifkan mode cluster Swarm di server bare-metal Anda:
```bash
docker swarm init
```
*(Jika server memiliki beberapa IP, tentukan IP utama dengan `--advertise-addr <IP_SERVER>`)*.

---

### 3. Build Docker Image API
Build image API yang sudah dioptimasi khusus CPU PyTorch:
```bash
docker build -t agrivision_api:latest .
```

---

### 4. Deploy Stack ke Docker Swarm
Luncurkan seluruh stack (Nginx + 3 Replikasi FastAPI) dengan perintah:
```bash
docker stack deploy -c docker-compose.yml agrivision_stack
```

---

### 5. Memeriksa Status Layanan & Replikasi
Periksa apakah seluruh service sudah berjalan normal (3 dari 3 replika):
```bash
docker stack services agrivision_stack
```
Output yang diharapkan:
```text
ID             NAME                     MODE         REPLICAS   IMAGE                   PORTS
xxxx           agrivision_stack_nginx   replicated   1/1        nginx:alpine            *:80->80/tcp
yyyy           agrivision_stack_api     replicated   3/3        agrivision_api:latest   
```

Melihat log download model dari Hugging Face:
```bash
docker service logs -f agrivision_stack_api
```
*(Anda akan melihat pesan bahwa model `best_model.pth` otomatis diunduh dari Hugging Face dan dimuat ke memori RAM)*.

---

### 6. Pengujian Endpoint Produksi (Testing)

#### A. Health Check via Nginx (Port 80)
```bash
curl http://localhost/health
```
Respons yang diharapkan:
```json
{"status":"ok","message":"API siap menerima request."}
```

#### B. Prediksi Daun Tomat (`/v1/predict`)
```bash
curl -X POST -F "file=@/path/to/gambar_daun.jpg" http://localhost/v1/predict
```
Respons yang diharapkan:
```json
{
  "success": true,
  "data": {
    "diagnosis": "Bercak Daun Bakteri (Tomato___Bacterial_spot)",
    "description": "Infeksi bakteri yang menyebabkan bercak kecil bersudut, sering kali dikelilingi halo kuning.",
    "recommendation": "Hindari penyiraman dari atas (overhead irrigation). Gunakan bakterisida berbasis tembaga (copper-based). Pastikan sirkulasi udara baik."
  }
}
```

---

## 🔄 Pemeliharaan & Operasional (Ops Cheat Sheet)

- **Melihat beban container:**
  ```bash
  docker stats
  ```

- **Scaling jumlah worker (misalnya ingin dinaikkan ke 5 replika saat panen raya):**
  ```bash
  docker service scale agrivision_stack_api=5
  ```

- **Update Model Baru (Zero Downtime Rolling Update):**
  Jika Anda melatih model baru dan mengunggahnya ke Hugging Face, perbarui service tanpa mematikan traffic:
  ```bash
  docker service update --force agrivision_stack_api
  ```

- **Menghentikan Stack:**
  ```bash
  docker stack rm agrivision_stack
  ```
