import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Smile, 
  Eye, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Camera as CameraIcon,
  Trophy,
  Flame,
  HelpCircle,
  MapPin,
  X
} from 'lucide-react';
import { WorldEngine } from '../3d/engine/WorldEngine';
import type { CameraMode, InputState } from '../3d/types';

interface InteractiveTomato3DProps {
  onInteract?: (action: string) => void;
}

export const InteractiveTomato3D: React.FC<InteractiveTomato3DProps> = ({ onInteract }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);

  // Reactive UI States
  const [speedGauge, setSpeedGauge] = useState<number>(0);
  const [bounces, setBounces] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [mascotMode, setMascotMode] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [currentZone, setCurrentZone] = useState<string>('Ruang Laboratorium Botani');
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  // Initialize 3D Engine Facade
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new WorldEngine({
      enableAudio: isAudioEnabled,
      mascotMode: mascotMode,
      cameraMode: cameraMode,
      callbacks: {
        onScoreChange: (newScore) => {
          setScore(newScore);
          onInteract?.(`score_${newScore}`);
        },
        onSpeedChange: (speedPercent) => {
          setSpeedGauge(speedPercent);
        },
        onBounce: (bounceCount) => {
          setBounces(bounceCount);
          onInteract?.('bounce');
        },
        onZoneChange: (zoneName) => {
          setCurrentZone(zoneName);
          onInteract?.(`zone_${zoneName}`);
        }
      }
    });

    engine.init(mountRef.current);
    engineRef.current = engine;

    // Keyboard Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => ({ ...prev, [key]: true }));

      if (key === 'w' || key === 'arrowup') engine.setInput('forward', true);
      if (key === 's' || key === 'arrowdown') engine.setInput('backward', true);
      if (key === 'a' || key === 'arrowleft') engine.setInput('left', true);
      if (key === 'd' || key === 'arrowright') engine.setInput('right', true);
      if (key === ' ' || key === 'spacebar') {
        e.preventDefault();
        engine.triggerJump();
      }
      if (key === 'shift') engine.setInput('turbo', true);
      if (key === 'e') engine.triggerSpin();
      if (key === 'r') engine.resetCharacter();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => ({ ...prev, [key]: false }));

      if (key === 'w' || key === 'arrowup') engine.setInput('forward', false);
      if (key === 's' || key === 'arrowdown') engine.setInput('backward', false);
      if (key === 'a' || key === 'arrowleft') engine.setInput('left', false);
      if (key === 'd' || key === 'arrowright') engine.setInput('right', false);
      if (key === 'shift') engine.setInput('turbo', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // UI Handlers
  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((prev) => {
      const next = !prev;
      engineRef.current?.setAudioEnabled(next);
      return next;
    });
  }, []);

  const toggleMascot = useCallback(() => {
    setMascotMode((prev) => {
      const next = !prev;
      engineRef.current?.setMascotMode(next);
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraMode((prev) => {
      const next: CameraMode = prev === 'chase' ? 'orbit' : 'chase';
      engineRef.current?.setCameraMode(next);
      return next;
    });
  }, []);

  const handleVirtualInput = useCallback((key: keyof InputState, active: boolean) => {
    engineRef.current?.setInput(key, active);
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.triggerJump();
  }, []);

  const handleSpin = useCallback(() => {
    engineRef.current?.triggerSpin();
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.resetCharacter();
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 620,
      minHeight: 520,
      borderRadius: 24,
      overflow: 'hidden',
      background: '#070A12',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      userSelect: 'none',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 3D WebGL Canvas Viewport */}
      <div 
        ref={mountRef} 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: cameraMode === 'orbit' ? 'grab' : 'default',
          display: 'block'
        }} 
      />

      {/* Top Floating Header & Status Bar */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 10,
        gap: 12
      }}>
        {/* Left: Dynamic Horticultural Zone Indicator & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '8px 16px',
            borderRadius: 16,
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#A7F3D0',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'auto'
          }}>
            <MapPin size={16} color="#34D399" />
            <span>{currentZone}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '8px 16px',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#E2E8F0',
            fontSize: 12,
            fontFamily: 'monospace',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color={speedGauge > 50 ? '#FBBF24' : '#34D399'} />
              <span>SPD: <strong style={{ color: '#34D399' }}>{speedGauge}%</strong></span>
            </div>
            <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={14} color="#FB7185" />
              <span>BOUNCES: <strong style={{ color: '#FDA4AF' }}>{bounces}</strong></span>
            </div>
            <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={14} color="#FBBF24" />
              <span>SCORE: <strong style={{ color: '#FCD34D' }}>{score}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Engine Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          <button
            onClick={toggleCamera}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              background: cameraMode === 'chase' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(5, 150, 105, 0.9)',
              border: `1px solid ${cameraMode === 'chase' ? 'rgba(255, 255, 255, 0.15)' : '#34D399'}`,
              color: '#FFF',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            title="Ganti Mode Kamera (Chase / Orbit)"
          >
            <CameraIcon size={14} />
            <span>{cameraMode === 'chase' ? 'Chase Cam' : 'Orbit Cam'}</span>
          </button>

          <button
            onClick={toggleMascot}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              background: mascotMode ? 'rgba(225, 29, 72, 0.85)' : 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${mascotMode ? '#FB7185' : 'rgba(255, 255, 255, 0.15)'}`,
              color: '#FFF',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            title="Toggle Tampilan Wajah Maskot"
          >
            {mascotMode ? <Smile size={14} /> : <Eye size={14} />}
            <span>Mascot Face</span>
          </button>

          <button
            onClick={toggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 10px',
              borderRadius: 12,
              fontSize: 12,
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
            {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => setShowControlsGuide((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 10px',
              borderRadius: 12,
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
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Floating Controls Guide Card */}
      {showControlsGuide && (
        <div style={{
          position: 'absolute',
          top: 68,
          right: 16,
          width: 300,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 20,
          padding: 18,
          color: '#E2E8F0',
          fontSize: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#38BDF8' }}>
              🎮 Kontrol Eksplorasi 3D
            </span>
            <button
              onClick={() => setShowControlsGuide(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
            >
              <X size={16} />
            </button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: '#FFF' }}>W, A, S, D / Panah</strong>: Menjelajahi laboratorium & padang rumput</li>
            <li><strong style={{ color: '#FFF' }}>Spasi</strong>: Melompat & memantulkan tomat</li>
            <li><strong style={{ color: '#FFF' }}>Shift</strong>: Turbo sprint akselerasi tinggi</li>
            <li><strong style={{ color: '#FFF' }}>E</strong>: 360° Acrobatic Spin Trick (+50 Poin)</li>
            <li><strong style={{ color: '#FFF' }}>R</strong>: Reset posisi ke laboratorium</li>
            <li><strong style={{ color: '#FFF' }}>Tarik Mouse (Orbit)</strong>: Memutar sudut pandang kamera</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 11, color: '#34D399', fontWeight: 600 }}>
            💡 Kunjungi greenhouse dan kumpulkan seluruh buah tomat emas!
          </p>
        </div>
      )}

      {/* Bottom Gamepad & Action Buttons */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: 18,
        right: 18,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        {/* On-Screen Touch Gamepad */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: 12,
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.08em', color: '#94A3B8', fontFamily: 'monospace', fontWeight: 600 }}>
            WASD GAMEPAD
          </span>

          {/* Up Button */}
          <button
            onPointerDown={() => handleVirtualInput('forward', true)}
            onPointerUp={() => handleVirtualInput('forward', false)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['w'] || activeKeys['arrowup'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              cursor: 'pointer',
              transition: 'all 0.1s'
            }}
          >
            <ArrowUp size={20} />
          </button>

          {/* Left, Down, Right */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onPointerDown={() => handleVirtualInput('left', true)}
              onPointerUp={() => handleVirtualInput('left', false)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeKeys['a'] || activeKeys['arrowleft'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onPointerDown={() => handleVirtualInput('backward', true)}
              onPointerUp={() => handleVirtualInput('backward', false)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeKeys['s'] || activeKeys['arrowdown'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
            >
              <ArrowDown size={20} />
            </button>
            <button
              onPointerDown={() => handleVirtualInput('right', true)}
              onPointerUp={() => handleVirtualInput('right', false)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeKeys['d'] || activeKeys['arrowright'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
            >
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Action Row: Turbo, Jump, Spin */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              onPointerDown={() => handleVirtualInput('turbo', true)}
              onPointerUp={() => handleVirtualInput('turbo', false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 10,
                background: activeKeys['shift'] ? '#0284C7' : 'rgba(2, 132, 199, 0.25)',
                border: '1px solid #0284C7',
                color: '#FFF',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              <Zap size={12} />
              <span>TURBO</span>
            </button>

            <button
              onClick={handleJump}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                background: 'rgba(5, 150, 105, 0.25)',
                border: '1px solid #10B981',
                color: '#34D399',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              JUMP
            </button>

            <button
              onClick={handleSpin}
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                background: 'rgba(225, 29, 72, 0.25)',
                border: '1px solid #FB7185',
                color: '#FDA4AF',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              SPIN
            </button>
          </div>
        </div>

        {/* Reset Position Button */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 16,
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#E2E8F0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={15} color="#34D399" />
            <span>Reset Posisi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
