import React from 'react';
import { 
  MapPin, 
  Zap, 
  Flame, 
  Trophy, 
  Maximize, 
  Minimize, 
  Smartphone, 
  Camera as CameraIcon, 
  Smile, 
  Eye, 
  Map, 
  Volume2, 
  VolumeX, 
  HelpCircle 
} from 'lucide-react';
import type { CameraMode } from '../../3d/types';

interface HUDStatusBarProps {
  currentZone: string;
  bounces: number;
  score: number;
  isMobileLandscape: boolean;
  isFullscreen: boolean;
  isTiltEnabled: boolean;
  cameraMode: CameraMode;
  mascotMode: boolean;
  showMiniMap: boolean;
  isInventoryOpen: boolean;
  inventoryCount: number;
  isQuestBoardOpen: boolean;
  isAudioEnabled: boolean;
  speedTextRef: React.RefObject<HTMLElement | null>;
  onToggleFullscreen: () => void;
  onToggleTiltSteer: () => void;
  onToggleCamera: () => void;
  onToggleMascot: () => void;
  onToggleMiniMap: () => void;
  onToggleInventory: () => void;
  onToggleQuestBoard: () => void;
  onToggleAudio: () => void;
  onToggleControlsGuide: () => void;
}

export const HUDStatusBar: React.FC<HUDStatusBarProps> = ({
  currentZone,
  bounces,
  score,
  isMobileLandscape,
  isFullscreen,
  isTiltEnabled,
  cameraMode,
  mascotMode,
  showMiniMap,
  isInventoryOpen,
  inventoryCount,
  isQuestBoardOpen,
  isAudioEnabled,
  speedTextRef,
  onToggleFullscreen,
  onToggleTiltSteer,
  onToggleCamera,
  onToggleMascot,
  onToggleMiniMap,
  onToggleInventory,
  onToggleQuestBoard,
  onToggleAudio,
  onToggleControlsGuide
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pointerEvents: 'none',
      zIndex: 20,
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4
    }}>
      {/* Left: Zone & Stats Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: isMobileLandscape ? '5px 10px' : '7px 14px',
          borderRadius: 12,
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#A7F3D0',
          fontSize: isMobileLandscape ? 11 : 12,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <MapPin size={isMobileLandscape ? 13 : 15} color="#34D399" />
          <span>{currentZone}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobileLandscape ? 8 : 12,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: isMobileLandscape ? '5px 10px' : '7px 14px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#E2E8F0',
          fontSize: isMobileLandscape ? 10 : 11,
          fontFamily: 'monospace',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={12} color="#34D399" />
            <span>SPD: <strong ref={speedTextRef as any} style={{ color: '#34D399' }}>0%</strong></span>
          </div>
          <div style={{ width: 1, height: 10, background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Flame size={12} color="#FB7185" />
            <span><strong style={{ color: '#FDA4AF' }}>{bounces}</strong></span>
          </div>
          <div style={{ width: 1, height: 10, background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trophy size={12} color="#FBBF24" />
            <span><strong style={{ color: '#FCD34D' }}>{score}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Engine Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto', flexShrink: 0 }}>
        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 10px' : '7px 12px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: isFullscreen ? 'rgba(56, 189, 248, 0.85)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${isFullscreen ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s'
          }}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
        >
          {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
          {!isMobileLandscape && <span>{isFullscreen ? 'Normal' : 'Layar Penuh'}</span>}
        </button>

        {/* Gyroscope / Tilt Steering Button ("HP Miring/Tilt") */}
        <button
          onClick={onToggleTiltSteer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 10px' : '7px 12px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: isTiltEnabled ? 'rgba(16, 185, 129, 0.9)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${isTiltEnabled ? '#34D399' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isTiltEnabled ? '0 0 14px rgba(16, 185, 129, 0.5)' : 'none',
            transition: 'all 0.2s'
          }}
          title={isTiltEnabled ? 'Matikan Sensor Miring (Gyroscope)' : 'Nyalakan Sensor Miring HP (Tilt Steering)'}
        >
          <Smartphone size={13} />
          <span>{isTiltEnabled ? 'Tilt: ON' : 'Tilt: OFF'}</span>
        </button>

        {/* Camera Mode Toggle */}
        <button
          onClick={onToggleCamera}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 9px' : '7px 12px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: cameraMode === 'chase' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(5, 150, 105, 0.9)',
            border: `1px solid ${cameraMode === 'chase' ? 'rgba(255, 255, 255, 0.15)' : '#34D399'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s'
          }}
          title="Ganti Mode Kamera (Chase / Orbit)"
        >
          <CameraIcon size={13} />
          {!isMobileLandscape && <span>{cameraMode === 'chase' ? 'Chase Cam' : 'Orbit Cam'}</span>}
        </button>

        {/* Mascot Face Mode Toggle */}
        <button
          onClick={onToggleMascot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 9px' : '7px 12px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: mascotMode ? 'rgba(225, 29, 72, 0.85)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${mascotMode ? '#FB7185' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s'
          }}
          title="Toggle Wajah Maskot Tomat"
        >
          {mascotMode ? <Smile size={13} /> : <Eye size={13} />}
          {!isMobileLandscape && <span>Mascot</span>}
        </button>

        {/* Mini-Map Radar Toggle */}
        <button
          onClick={onToggleMiniMap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 9px' : '7px 11px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: showMiniMap ? 'rgba(16, 185, 129, 0.85)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${showMiniMap ? '#34D399' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s'
          }}
          title={showMiniMap ? 'Sembunyikan Mini-Map Radar' : 'Tampilkan Mini-Map Radar'}
        >
          <Map size={13} />
          {!isMobileLandscape && <span>Radar</span>}
        </button>

        {/* Inventory Bag Toggle Button */}
        <button
          onClick={onToggleInventory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 9px' : '7px 11px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: isInventoryOpen ? 'rgba(234, 179, 8, 0.9)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${isInventoryOpen ? '#FDE047' : 'rgba(234, 179, 8, 0.45)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isInventoryOpen ? '0 0 14px rgba(234, 179, 8, 0.5)' : 'none',
            transition: 'all 0.2s'
          }}
          title="Buka Tas & Inventori Peralatan (I)"
        >
          <span style={{ fontSize: 13 }}>🎒</span>
          {!isMobileLandscape && <span>Tas ({inventoryCount}/16)</span>}
        </button>

        {/* Guild Bounty Board Button */}
        <button
          onClick={onToggleQuestBoard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: isMobileLandscape ? '6px 9px' : '7px 11px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: isQuestBoardOpen ? 'rgba(217, 119, 6, 0.95)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${isQuestBoardOpen ? '#FDE047' : 'rgba(217, 119, 6, 0.5)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isQuestBoardOpen ? '0 0 14px rgba(217, 119, 6, 0.5)' : 'none',
            transition: 'all 0.2s'
          }}
          title="Buka Papan Sayembara Serikat Tani (Bounty Board)"
        >
          <span style={{ fontSize: 13 }}>📜</span>
          {!isMobileLandscape && <span>Sayembara</span>}
        </button>

        {/* Audio FX */}
        <button
          onClick={onToggleAudio}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobileLandscape ? '6px 8px' : '7px 9px',
            borderRadius: 10,
            fontSize: 11,
            background: isAudioEnabled ? 'rgba(5, 150, 105, 0.85)' : 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${isAudioEnabled ? '#34D399' : 'rgba(255, 255, 255, 0.15)'}`,
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s'
          }}
          title={isAudioEnabled ? 'Matikan Suara FX' : 'Nyalakan Suara FX'}
        >
          {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        {/* Help Guide */}
        <button
          onClick={onToggleControlsGuide}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobileLandscape ? '6px 8px' : '7px 9px',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#E2E8F0',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s'
          }}
          title="Panduan Kontrol Eksplorasi"
        >
          <HelpCircle size={14} />
        </button>
      </div>
    </div>
  );
};
