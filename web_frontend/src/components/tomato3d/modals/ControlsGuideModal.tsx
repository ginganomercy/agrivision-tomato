import React from 'react';
import { X } from 'lucide-react';

interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 60,
      right: 16,
      width: 310,
      maxHeight: '80vh',
      overflowY: 'auto',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: 18,
      padding: 16,
      color: '#E2E8F0',
      fontSize: 12,
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      zIndex: 35
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#38BDF8' }}>
          🎮 Panduan Eksplorasi Mobile & Tilt
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
        >
          <X size={16} />
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <li><strong style={{ color: '#FFF' }}>📱 HP Miring (Landscape)</strong>: Jempol kiri di D-pad, jempol kanan untuk Lompat, Turbo & Spin.</li>
        <li><strong style={{ color: '#FFF' }}>📲 Sensor Miring (Tilt Steer)</strong>: Miringkan fisik ponsel ke kiri/kanan untuk mengemudi otomatis!</li>
        <li><strong style={{ color: '#FFF' }}>⛶ Mode Layar Penuh</strong>: Tekan tombol Layar Penuh untuk tampilan borderless tanpa batas.</li>
        <li><strong style={{ color: '#FFF' }}>W, A, S, D</strong>: Kendali keyboard fisik di laptop / PC.</li>
        <li><strong style={{ color: '#FFF' }}>Spasi</strong>: Melompat tinggi & memantulkan tomat.</li>
        <li><strong style={{ color: '#FFF' }}>Shift</strong>: Turbo sprint akselerasi kecepatan penuh.</li>
        <li><strong style={{ color: '#FFF' }}>F / J</strong>: Tebasan pedang daun botani.</li>
        <li><strong style={{ color: '#FFF' }}>E</strong>: Interaksi dengan NPC & Papan Sayembara (atau Spin jika jauh).</li>
        <li><strong style={{ color: '#FFF' }}>I / B</strong>: Buka tas inventori & perlengkapan.</li>
      </ul>
    </div>
  );
};
