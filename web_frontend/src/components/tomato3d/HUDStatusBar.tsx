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
      top: isMobileLandscape ? 8 : 12,
      left: isMobileLandscape ? 8 : 14,
      right: isMobileLandscape ? 8 : 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pointerEvents: 'none',
      zIndex: 20,
      gap: 8,
      overflow: 'hidden',
      flexWrap: 'nowrap'
    }}>
      {/* Left: Zone & Stats Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* Dynamic Zone Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: isMobileLandscape ? '5px 8px' : '6px 12px',
          borderRadius: 12,
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#A7F3D0',
          fontSize: isMobileLandscape ? 10.5 : 11.5,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
          whiteSpace: 'nowrap',
          maxWidth: isMobileLandscape ? 130 : 210,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexShrink: 1
        }} title={currentZone}>
          <MapPin size={isMobileLandscape ? 12 : 14} color="#34D399" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentZone}
          </span>
        </div>

        {/* Telemetry Stats Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobileLandscape ? 6 : 8,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: isMobileLandscape ? '5px 8px' : '6px 11px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#E2E8F0',
          fontSize: isMobileLandscape ? 9.5 : 10.5,
          fontFamily: 'monospace',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Zap size={11} color="#34D399" />
            <span>SPD: <strong ref={speedTextRef as any} style={{ color: '#34D399' }}>0%</strong></span>
          </div>
          <div style={{ width: 1, height: 9, background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Flame size={11} color="#FB7185" />
            <span><strong style={{ color: '#FDA4AF' }}>{bounces}</strong></span>
          </div>
          <div style={{ width: 1, height: 9, background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Trophy size={11} color="#FBBF24" />
            <span><strong style={{ color: '#FCD34D' }}>{score}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Sleek, Responsive Engine Control Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        pointerEvents: 'auto',
        flexShrink: 0
      }}>
        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobileLandscape ? '6px 8px' : '6px 10px',
            borderRadius: 10,
            fontSize: 10.5,
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
        </button>

        {/* Gyroscope / Tilt Steering Button ("HP Miring/Tilt") */}
        <button
          onClick={onToggleTiltSteer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isMobileLandscape ? '6px 8px' : '6px 10px',
            borderRadius: 10,
            fontSize: 10.5,
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
          <Smartphone size={12} />
          <span>{isTiltEnabled ? 'Tilt: ON' : 'Tilt: OFF'}</span>
        </button>

        {/* Camera Mode Toggle */}
        <button
          onClick={onToggleCamera}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isMobileLandscape ? '6px 8px' : '6px 10px',
            borderRadius: 10,
            fontSize: 10.5,
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
          <CameraIcon size={12} />
          <span>{cameraMode === 'chase' ? 'Chase' : 'Orbit'}</span>
        </button>

        {/* Mascot Face Mode Toggle */}
        <button
          onClick={onToggleMascot}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobileLandscape ? '6px 8px' : '6px 9px',
            borderRadius: 10,
            fontSize: 10.5,
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
        </button>

        {/* Mini-Map Radar Toggle */}
        <button
          onClick={onToggleMiniMap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isMobileLandscape ? '6px 8px' : '6px 10px',
            borderRadius: 10,
            fontSize: 10.5,
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
          <Map size={12} />
          <span>Radar</span>
        </button>

        {/* Inventory Bag Toggle Button */}
        <button
          onClick={onToggleInventory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isMobileLandscape ? '6px 8px' : '6px 10px',
            borderRadius: 10,
            fontSize: 10.5,
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
          <span style={{ fontSize: 12 }}>🎒</span>
          <span>Tas ({inventoryCount}/16)</span>
        </button>

        {/* Guild Bounty Board Button */}
        <button
          onClick={onToggleQuestBoard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isMobileLandscape ? '6px 8px' : '6px 10px',
            borderRadius: 10,
            fontSize: 10.5,
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
          <span style={{ fontSize: 12 }}>📜</span>
          <span>Sayembara</span>
        </button>

        {/* Audio FX */}
        <button
          onClick={onToggleAudio}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobileLandscape ? '6px 7px' : '6px 8px',
            borderRadius: 10,
            fontSize: 10.5,
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
          {isAudioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>

        {/* Help Guide */}
        <button
          onClick={onToggleControlsGuide}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobileLandscape ? '6px 7px' : '6px 8px',
            borderRadius: 10,
            fontSize: 10.5,
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
          <HelpCircle size={13} />
        </button>
      </div>
    </div>
  );
};
