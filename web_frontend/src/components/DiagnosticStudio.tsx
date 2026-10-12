import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Printer, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  Leaf, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Share2,
  SwitchCamera
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PredictionData {
  prediction_id: string;
  diagnosis: string;
  description: string;
  recommendation: string;
}

interface ApiResponse {
  success: boolean;
  trace_id: string;
  data: PredictionData;
  error?: {
    code: string;
    message: string;
    trace_id?: string;
  };
}

export const DiagnosticStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Endpoint API (Otomatis menyesuaikan host lokal vs domain produksi)
  const API_URL = import.meta.env.VITE_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'https://agrivision.pbjt.ac.id/v1/predict'
      : '/v1/predict'
  );

  // Web Audio Synth Chime for Diagnosis Done
  const playDiagnosticChime = useCallback((isHealthy: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const freqs = isHealthy ? [440, 554.37, 659.25] : [349.23, 293.66]; // Major chord vs solemn tone
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.1);
        gain.gain.setValueAtTime(0.12, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.36);
      });
    } catch {
      // Audio not permitted without interaction
    }
  }, []);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format file tidak didukung. Harap unggah berkas gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file melebihi batas maksimal 10 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Preset sintetis instan
  const loadPreset = (type: 'healthy' | 'bacterial' | 'blight') => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'healthy') {
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(128, 128, 95, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'bacterial') {
      ctx.fillStyle = '#451A03';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(128, 128, 60, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(128, 128, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `sample_${type}.jpg`, { type: 'image/jpeg' });
        handleFileChange(file);
      }
    }, 'image/jpeg');
  };

  // Kamera WebCam Capture
  const startCameraStream = async (mode: 'environment' | 'user') => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch {
      setErrorMessage('Tidak dapat mengakses kamera perangkat. Harap periksa izin akses webcam/kamera.');
      setIsCameraActive(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsCameraActive(false);
    } else {
      startCameraStream(facingMode);
    }
  };

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
          handleFileChange(file);
          toggleCamera();
        }
      }, 'image/jpeg');
    }
  };

  // Eksekusi Prediksi Deep Learning Edge
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    const start = performance.now();

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });

      const data: ApiResponse = await response.json();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));

      if (response.ok && data.success) {
        setResult(data);
        const isHealthy = data.data.diagnosis.toLowerCase().includes('healthy');
        playDiagnosticChime(isHealthy);

        if (isHealthy) {
          confetti({
            particleCount: 85,
            spread: 70,
            origin: { y: 0.65 },
            colors: ['#10B981', '#34D399', '#6EE7B7']
          });
        }
      } else {
        setErrorMessage(data.error?.message || 'Gagal menganalisis gambar tanaman.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kegagalan jaringan saat menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, API_URL, playDiagnosticChime]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyClinicalReport = () => {
    if (!result) return;
    const md = `
# AgriVision Pathology Report
- **Diagnosis**: ${result.data.diagnosis}
- **Trace ID**: ${result.trace_id}
- **Prediction ID**: ${result.data.prediction_id}
- **Latency**: ${latencyMs}ms

## Description
${result.data.description}

## Agronomic Recommendation
${result.data.recommendation}
    `.trim();
    copyToClipboard(md, 'report');
  };

  const printReport = () => {
    window.print();
  };

  // Severity Level Computation
  const getSeverity = (diagnosis: string) => {
    const d = diagnosis.toLowerCase();
    if (d.includes('healthy')) {
      return { level: 'Optimal (Sehat)', score: 5, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (d.includes('bacterial') || d.includes('target') || d.includes('septoria')) {
      return { level: 'Moderate Infection', score: 65, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    }
    return { level: 'Critical Pathogen', score: 92, color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' };
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: 28,
      width: '100%'
    }}>
      {/* Panel 1: Unggah Gambar & Scanner */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 32,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Leaf size={22} color="#F43F5E" />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFF' }}>Pemindai Daun Tomat</h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {isCameraActive && (
              <button
                onClick={switchCameraFacing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#CBD5E1',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Ganti Kamera Depan / Belakang"
              >
                <SwitchCamera size={14} />
              </button>
            )}
            <button
              onClick={toggleCamera}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isCameraActive ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isCameraActive ? '#F43F5E' : 'rgba(255, 255, 255, 0.12)'}`,
                color: isCameraActive ? '#F43F5E' : '#CBD5E1',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Camera size={15} />
              <span>{isCameraActive ? 'Tutup Kamera' : 'Buka Kamera'}</span>
            </button>
          </div>
        </div>

        {/* Live Video Camera Stream */}
        {isCameraActive && (
          <div style={{ marginBottom: 20, borderRadius: 16, overflow: 'hidden', border: '1px solid #F43F5E', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 240, objectFit: 'cover' }} />
            <button
              onClick={captureCameraFrame}
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#F43F5E',
                color: '#FFF',
                border: 'none',
                padding: '8px 22px',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(244, 63, 94, 0.5)'
              }}
            >
              📸 Ambil Foto Daun
            </button>
          </div>
        )}

        {/* Dropzone Area */}
        {!isCameraActive && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(255, 255, 255, 0.18)',
              borderRadius: 18,
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(5, 8, 14, 0.35)',
              transition: 'all 0.2s',
              marginBottom: 20
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
            />
            <UploadCloud size={46} color="#38BDF8" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
              Tarik & Letakkan Foto Daun Tomat
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              Mendukung JPG, PNG, atau WEBP (Maksimal 10 MB)
            </div>
          </div>
        )}

        {/* Image Preview Box with Sci-Fi Laser Scan Effect */}
        {previewUrl && (
          <div style={{
            position: 'relative',
            width: '100%',
            height: 210,
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 20,
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Holographic Laser Scanline when Loading */}
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, transparent, #38BDF8, #F43F5E, transparent)',
                boxShadow: '0 0 16px #38BDF8, 0 0 32px #F43F5E',
                animation: 'scanAnimation 1.6s ease-in-out infinite'
              }} />
            )}

            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,0.65)',
                border: 'none',
                color: '#FFF',
                borderRadius: '50%',
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: !selectedFile || isLoading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #F43F5E, #E11D48)',
            color: !selectedFile || isLoading ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: !selectedFile || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: selectedFile && !isLoading ? '0 4px 22px rgba(244, 63, 94, 0.45)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="spin-animation" />
              <span>Memindai Jaringan Neural (MobileNetV2)...</span>
            </>
          ) : (
            <>
              <Activity size={18} />
              <span>Analisis Penyakit Daun</span>
            </>
          )}
        </button>

        {/* Preset Sample Buttons */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Atau Gunakan Sampel Cepat:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => loadPreset('healthy')}
              style={{
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🍃 Daun Sehat
            </button>
            <button
              onClick={() => loadPreset('bacterial')}
              style={{
                padding: '6px 12px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#FB7185',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🍂 Bercak Bakteri
            </button>
            <button
              onClick={() => loadPreset('blight')}
              style={{
                padding: '6px 12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#FBBF24',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🥀 Hawar Daun
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            marginTop: 16,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#FCA5A5',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <XCircle size={18} color="#EF4444" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Panel 2: Hasil Diagnosis Agronomi */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 32,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={22} color="#10B981" />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#FFF' }}>Dossier Patologi Tanaman</h3>
          </div>
          {latencyMs !== null && (
            <div style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#38BDF8',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '4px 10px',
              borderRadius: 6
            }}>
              Latency: {latencyMs}ms
            </div>
          )}
        </div>

        {/* Empty State */}
        {!result && !isLoading && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#64748B',
            padding: 40
          }}>
            <Layers size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Belum Ada Data Inferensi</div>
            <div style={{ fontSize: 13, maxWidth: 300 }}>
              Silakan pilih foto daun di sebelah kiri untuk menghasilkan diagnosis patogen otomatis.
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: '#94A3B8'
          }}>
            <RefreshCw size={36} color="#F43F5E" className="spin-animation" />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Mengeksekusi model klasifikasi...</div>
          </div>
        )}

        {/* Result Content */}
        {result && result.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Diagnosis Badge + Severity Indicator */}
            {(() => {
              const sev = getSeverity(result.data.diagnosis);
              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: sev.bg,
                  border: `1px solid ${sev.color}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {result.data.diagnosis.toLowerCase().includes('healthy') ? (
                      <CheckCircle2 size={22} color={sev.color} />
                    ) : (
                      <AlertTriangle size={22} color={sev.color} />
                    )}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: sev.color }}>
                        {result.data.diagnosis}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                        {sev.level}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.3)',
                    color: sev.color
                  }}>
                    {sev.score}% Severity
                  </div>
                </div>
              );
            })()}

            {/* Tracing Meta Row */}
            <div style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#94A3B8',
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Trace ID:</span>
                <span style={{ color: '#38BDF8' }}>{result.trace_id}</span>
                <button
                  onClick={() => copyToClipboard(result.trace_id, 'trace')}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                >
                  {copiedId === 'trace' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Prediction ID:</span>
                <span style={{ color: '#F43F5E' }}>{result.data.prediction_id}</span>
                <button
                  onClick={() => copyToClipboard(result.data.prediction_id, 'pred')}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                >
                  {copiedId === 'pred' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Pathogen Description */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                Deskripsi & Karakteristik Patogen
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#F1F5F9' }}>
                {result.data.description}
              </p>
            </div>

            {/* Agronomic Recommendations */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              borderLeft: '4px solid #38BDF8',
              borderRadius: 14,
              padding: 18
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                Rekomendasi Penanganan & Pengobatan
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#E2E8F0' }}>
                {result.data.recommendation}
              </p>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                onClick={copyClinicalReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38BDF8',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedId === 'report' ? <Check size={15} color="#10B981" /> : <Share2 size={15} />}
                <span>{copiedId === 'report' ? 'Tersalin!' : 'Salin Laporan'}</span>
              </button>

              <button
                onClick={printReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFF',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} />
                <span>Cetak Laporan</span>
              </button>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94A3B8',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>Raw JSON</span>
                {showRawJson ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Collapsible JSON Viewer */}
            {showRawJson && (
              <pre style={{
                background: '#05080E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#38BDF8',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
