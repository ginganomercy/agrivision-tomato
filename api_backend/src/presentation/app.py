import streamlit as st
from PIL import Image
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.application.inference_service import InferenceService

# Path statis untuk MVP
MODEL_PATH = 'data/best_model.pth'
REMEDIES_PATH = 'data/remedies.json'

@st.cache_resource
def load_service():
    """Menggunakan cache agar model tidak dimuat ulang setiap interaksi UI"""
    return InferenceService(model_path=MODEL_PATH, remedies_path=REMEDIES_PATH)

def main():
    st.set_page_config(page_title="AgriVision MVP", page_icon="🌾", layout="centered")
    
    st.title("🌾 AgriVision")
    st.markdown("**Asisten AI Deteksi Penyakit Tanaman**")
    st.markdown("Unggah foto daun tanaman Anda yang terlihat sakit, dan AI kami akan mendeteksinya serta memberikan saran penanganan.")

    service = load_service()

    uploaded_file = st.file_uploader("Pilih gambar daun...", type=["jpg", "jpeg", "png"])

    if uploaded_file is not None:
        # Tampilkan gambar
        image = Image.open(uploaded_file).convert('RGB')
        st.image(image, caption='Gambar yang diunggah', use_column_width=True)

        if st.button("Analisis Penyakit"):
            with st.spinner("Sedang menganalisis gambar menggunakan MobileNetV2..."):
                result = service.analyze_leaf(image)
                
                if result['status'] == 'success':
                    st.success(f"**Diagnosis:** {result['name']}")
                    st.info(f"**Deskripsi:** {result['description']}")
                    st.warning(f"**Saran Penanganan:** {result['recommendation']}")
                else:
                    st.error(f"Terjadi kesalahan: {result['message']}")

if __name__ == '__main__':
    main()
