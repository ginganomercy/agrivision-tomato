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
  Map,
  Maximize2,
  Minimize2,
  Navigation,
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
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerCoordsRef = useRef<{ x: number; z: number; heading: number }>({ x: 0, z: 0, heading: 0 });

  // Reactive UI States
  const [speedGauge, setSpeedGauge] = useState<number>(0);
  const [bounces, setBounces] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [mascotMode, setMascotMode] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);
  const [miniMapExpanded, setMiniMapExpanded] = useState<boolean>(false);
  const [currentZone, setCurrentZone] = useState<string>('Ruang Laboratorium Botani');
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});
  const [remainingCollectibles, setRemainingCollectibles] = useState<number>(22);

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
          setRemainingCollectibles(engine.getActiveCollectibles().length);
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
        },
        onPlayerUpdate: (pos, heading) => {
          playerCoordsRef.current = { x: pos.x, z: pos.z, heading };
        }
      }
    });

    engine.init(mountRef.current);
    engineRef.current = engine;
    setRemainingCollectibles(engine.getActiveCollectibles().length);

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
      if (key === 'r') {
        engine.resetCharacter();
        setRemainingCollectibles(engine.getActiveCollectibles().length);
      }
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

  // Real-time 2D Canvas Radar Rendering Loop (60 FPS decoupled from React state)
  useEffect(() => {
    if (!showMiniMap) return;
    let animId: number;

    const renderRadar = () => {
      animId = requestAnimationFrame(renderRadar);
      const canvas = radarCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const worldRadius = 84.0;
      const pad = 12;
      const scale = (cx - pad) / worldRadius;

      // 1. Clear & Background Radial Gradient
      ctx.clearRect(0, 0, w, h);

      // Radar Screen Circular Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
      ctx.clip();

      const bgGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, cx);
      bgGrad.addColorStop(0, '#0f2438');
      bgGrad.addColorStop(0.7, '#081424');
      bgGrad.addColorStop(1, '#040913');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // 2. Concentric Radar Distance Rings
      const rings = [28, 56, 80];
      ctx.lineWidth = 1;
      rings.forEach((rDist, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rDist * scale, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 2 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(52, 211, 153, 0.16)';
        ctx.setLineDash(idx === 2 ? [] : [3, 4]);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 3. Crosshairs & Cardinal Labels
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.beginPath();
      ctx.moveTo(cx, pad);
      ctx.lineTo(cx, h - pad);
      ctx.moveTo(pad, cy);
      ctx.lineTo(w - pad, cy);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, 8);
      ctx.fillText('S', cx, h - 8);
      ctx.fillText('W', 8, cy);
      ctx.fillText('E', w - 8, cy);

      // Coordinate mapping helpers
      const mapX = (x: number) => cx + x * scale;
      const mapY = (z: number) => cy + z * scale;

      // 4. Cartographic 5 Thematic Zones
      // Zone 4: South-West Irrigation Lake (-35, 35)
      const lakeX = mapX(-35);
      const lakeY = mapY(35);
      const lakeR = 20 * scale;
      ctx.beginPath();
      ctx.arc(lakeX, lakeY, lakeR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(29, 112, 184, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Wooden Pier line on lake shore
      ctx.beginPath();
      ctx.moveTo(mapX(-35), mapY(16.5));
      ctx.lineTo(mapX(-35), mapY(25.5));
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Zone 2: North-East Commercial Trellis Rows (35, -32)
      for (let tr = -2; tr <= 2; tr++) {
        const rowZ = mapY(-32 + tr * 4.2);
        ctx.beginPath();
        ctx.moveTo(mapX(24), rowZ);
        ctx.lineTo(mapX(46), rowZ);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Zone 3: North-West Wildflower Sanctuary (-35, -35)
      ctx.beginPath();
      ctx.arc(mapX(-35), mapY(-35), 14 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Zone 5: South-East Windmill Hill (38, 40)
      ctx.beginPath();
      ctx.arc(mapX(38), mapY(40), 16 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Zone 1: Central Greenhouse Laboratory (0, 0)
      const ghW = 18 * scale;
      const ghH = 14 * scale;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.fillRect(cx - ghW / 2, cy - ghH / 2, ghW, ghH);
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - ghW / 2, cy - ghH / 2, ghW, ghH);
      ctx.fillStyle = '#A7F3D0';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('LAB', cx, cy);

      // 5. Active Golden Collectibles (Shimmering dots)
      const items = engineRef.current?.getActiveCollectibles() || [];
      items.forEach((it) => {
        const ix = mapX(it.x);
        const iy = mapY(it.z);
        ctx.beginPath();
        ctx.arc(ix, iy, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FBBF24';
        ctx.fill();
        ctx.strokeStyle = '#FFFBEB';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // 6. Player Marker & Facing Direction
      const p = playerCoordsRef.current;
      const px = mapX(p.x);
      const py = mapY(p.z);

      // Heading Directional Arrow Pointer
      const headLen = 12;
      const tipX = px + Math.sin(p.heading) * headLen;
      const tipY = py + Math.cos(p.heading) * headLen;
      const leftWingX = px + Math.sin(p.heading + 2.4) * 6;
      const leftWingY = py + Math.cos(p.heading + 2.4) * 6;
      const rightWingX = px + Math.sin(p.heading - 2.4) * 6;
      const rightWingY = py + Math.cos(p.heading - 2.4) * 6;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftWingX, leftWingY);
      ctx.lineTo(px, py);
      ctx.lineTo(rightWingX, rightWingY);
      ctx.closePath();
      ctx.fillStyle = '#38BDF8';
      ctx.fill();

      // Red Tomato Player Marker Dot
      ctx.beginPath();
      ctx.arc(px, py, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    };

    renderRadar();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [showMiniMap, miniMapExpanded]);

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
    if (engineRef.current) {
      setRemainingCollectibles(engineRef.current.getActiveCollectibles().length);
    }
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
        gap: 12,
        flexWrap: 'wrap'
      }}>
        {/* Left: Dynamic Horticultural Zone Indicator & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '7px 14px',
            borderRadius: 14,
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#A7F3D0',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'auto'
          }}>
            <MapPin size={15} color="#34D399" />
            <span>{currentZone}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '7px 14px',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#E2E8F0',
            fontSize: 11,
            fontFamily: 'monospace',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} color={speedGauge > 50 ? '#FBBF24' : '#34D399'} />
              <span>SPD: <strong style={{ color: '#34D399' }}>{speedGauge}%</strong></span>
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(255, 255, 255, 0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Flame size={13} color="#FB7185" />
              <span>BOUNCES: <strong style={{ color: '#FDA4AF' }}>{bounces}</strong></span>
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(255, 255, 255, 0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trophy size={13} color="#FBBF24" />
              <span>SCORE: <strong style={{ color: '#FCD34D' }}>{score}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Engine Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, pointerEvents: 'auto', flexWrap: 'wrap' }}>
          <button
            onClick={toggleCamera}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 12,
              fontSize: 11,
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
              padding: '7px 12px',
              borderRadius: 12,
              fontSize: 11,
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

          {/* Mini-Map Radar Toggle */}
          <button
            onClick={() => setShowMiniMap((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: showMiniMap ? 'rgba(16, 185, 129, 0.85)' : 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${showMiniMap ? '#34D399' : 'rgba(255, 255, 255, 0.15)'}`,
              color: '#FFF',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            title={showMiniMap ? 'Sembunyikan Mini-Map Radar' : 'Tampilkan Mini-Map Radar'}
          >
            <Map size={14} />
            <span>Radar</span>
          </button>

          <button
            onClick={toggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 9px',
              borderRadius: 12,
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
            {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => setShowControlsGuide((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 9px',
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
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Floating Controls Guide Card */}
      {showControlsGuide && (
        <div style={{
          position: 'absolute',
          top: 68,
          right: 16,
          width: 310,
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
              🎮 Panduan Eksplorasi Padang Botani
            </span>
            <button
              onClick={() => setShowControlsGuide(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
            >
              <X size={16} />
            </button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <li><strong style={{ color: '#FFF' }}>W, A, S, D / Panah</strong>: Bergerak bebas ke arah pandangan kamera</li>
            <li><strong style={{ color: '#FFF' }}>Spasi</strong>: Melompat tinggi & memantulkan tomat</li>
            <li><strong style={{ color: '#FFF' }}>Shift</strong>: Turbo sprint akselerasi kecepatan penuh</li>
            <li><strong style={{ color: '#FFF' }}>E</strong>: 360° Acrobatic Spin Trick (+50 Poin)</li>
            <li><strong style={{ color: '#FFF' }}>R</strong>: Reset posisi karakter ke pintu laboratorium</li>
            <li><strong style={{ color: '#FFF' }}>Tarik Mouse (Orbit)</strong>: Memutar sudut pandang 360°</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 11, color: '#34D399', fontWeight: 600 }}>
            💡 Ikuti jalan setapak batu untuk mengunjungi 5 zona botani dan kumpulkan seluruh tomat emas!
          </p>
        </div>
      )}

      {/* Bottom-Left: Ergonomic On-Screen Touch Gamepad (Anti-Clipping guaranteed) */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        background: 'rgba(15, 23, 42, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '10px 14px',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        zIndex: 15,
        boxSizing: 'border-box'
      }}>
        <span style={{ fontSize: 9, letterSpacing: '0.1em', color: '#94A3B8', fontFamily: 'monospace', fontWeight: 700 }}>
          WASD GAMEPAD
        </span>

        {/* Up Button */}
        <button
          onPointerDown={() => handleVirtualInput('forward', true)}
          onPointerUp={() => handleVirtualInput('forward', false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeKeys['w'] || activeKeys['arrowup'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#FFF',
            cursor: 'pointer',
            boxShadow: activeKeys['w'] ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
            transition: 'all 0.1s'
          }}
          title="Maju (W / Panah Atas)"
        >
          <ArrowUp size={18} />
        </button>

        {/* Left, Down, Right Horizontal Row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onPointerDown={() => handleVirtualInput('left', true)}
            onPointerUp={() => handleVirtualInput('left', false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['a'] || activeKeys['arrowleft'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['a'] ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
              transition: 'all 0.1s'
            }}
            title="Kiri (A / Panah Kiri)"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onPointerDown={() => handleVirtualInput('backward', true)}
            onPointerUp={() => handleVirtualInput('backward', false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['s'] || activeKeys['arrowdown'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['s'] ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
              transition: 'all 0.1s'
            }}
            title="Mundur (S / Panah Bawah)"
          >
            <ArrowDown size={18} />
          </button>
          <button
            onPointerDown={() => handleVirtualInput('right', true)}
            onPointerUp={() => handleVirtualInput('right', false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['d'] || activeKeys['arrowright'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['d'] ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
              transition: 'all 0.1s'
            }}
            title="Kanan (D / Panah Kanan)"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Action Row: Turbo, Jump, Spin */}
        <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
          <button
            onPointerDown={() => handleVirtualInput('turbo', true)}
            onPointerUp={() => handleVirtualInput('turbo', false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              height: 26,
              padding: '0 8px',
              borderRadius: 8,
              background: activeKeys['shift'] ? '#0284C7' : 'rgba(2, 132, 199, 0.25)',
              border: '1px solid #0284C7',
              color: '#FFF',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title="Sprint Turbo (Shift)"
          >
            <Zap size={11} />
            <span>TURBO</span>
          </button>

          <button
            onClick={handleJump}
            style={{
              height: 26,
              padding: '0 10px',
              borderRadius: 8,
              background: 'rgba(5, 150, 105, 0.25)',
              border: '1px solid #10B981',
              color: '#34D399',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title="Melompat (Spasi)"
          >
            JUMP
          </button>

          <button
            onClick={handleSpin}
            style={{
              height: 26,
              padding: '0 8px',
              borderRadius: 8,
              background: 'rgba(225, 29, 72, 0.25)',
              border: '1px solid #FB7185',
              color: '#FDA4AF',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title="360 Akrobatik Spin (E)"
          >
            SPIN
          </button>
        </div>
      </div>

      {/* Bottom-Right: Reset Posisi Button (Docked cleanly above or in corner) */}
      <div style={{
        position: 'absolute',
        bottom: showMiniMap ? (miniMapExpanded ? 260 : 195) : 24,
        right: 24,
        pointerEvents: 'auto',
        zIndex: 15,
        transition: 'bottom 0.2s ease'
      }}>
        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 14,
            background: 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#E2E8F0',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'all 0.2s'
          }}
          title="Kembalikan karakter tomat ke pintu laboratorium (R)"
        >
          <RotateCcw size={13} color="#34D399" />
          <span>Reset Posisi</span>
        </button>
      </div>

      {/* Bottom-Right: 2D Canvas Radar Mini-Map */}
      {showMiniMap && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: 8,
          borderRadius: 20,
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          zIndex: 15
        }}>
          {/* Radar Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '2px 4px',
            fontSize: 10,
            color: '#34D399',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontFamily: 'monospace'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Navigation size={11} color="#34D399" />
              <span>RADAR 180M</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#FCD34D', fontSize: 9 }}>
                {remainingCollectibles} 🍅
              </span>
              <button
                onClick={() => setMiniMapExpanded((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={miniMapExpanded ? 'Perkecil Radar' : 'Perbesar Radar'}
              >
                {miniMapExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          </div>

          {/* Radar 2D Viewport */}
          <canvas
            ref={radarCanvasRef}
            width={miniMapExpanded ? 190 : 136}
            height={miniMapExpanded ? 190 : 136}
            style={{
              borderRadius: 14,
              display: 'block',
              cursor: 'crosshair'
            }}
          />
        </div>
      )}
    </div>
  );
};
