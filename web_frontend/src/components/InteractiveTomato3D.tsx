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
  Maximize,
  Minimize,
  Navigation,
  Smartphone,
  Sparkles,
  X
} from 'lucide-react';
import { WorldEngine } from '../3d/engine/WorldEngine';
import type { CameraMode, InputState } from '../3d/types';

interface InteractiveTomato3DProps {
  onInteract?: (action: string) => void;
}

export const InteractiveTomato3D: React.FC<InteractiveTomato3DProps> = ({ onInteract }) => {
  const rootRef = useRef<HTMLDivElement>(null);
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

  // Mobile Landscape & Tilt Ergonomics States
  const [isMobileLandscape, setIsMobileLandscape] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTiltEnabled, setIsTiltEnabled] = useState<boolean>(false);
  const [tiltSteerAngle, setTiltSteerAngle] = useState<number>(0);
  const tiltSteerRef = useRef<number>(0);

  // 1. Detect Screen Orientation and Size Changes
  useEffect(() => {
    const handleViewportChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isShortHeight = window.innerHeight <= 560;
      const isMobileWidth = window.innerWidth <= 1024;
      setIsMobileLandscape(isLandscape && (isShortHeight || isMobileWidth));

      const isCurrentFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isCurrentFullscreen);
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    document.addEventListener('fullscreenchange', handleViewportChange);
    document.addEventListener('webkitfullscreenchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      document.removeEventListener('fullscreenchange', handleViewportChange);
      document.removeEventListener('webkitfullscreenchange', handleViewportChange);
    };
  }, []);

  // 2. Fullscreen Mode Toggle
  const toggleFullscreen = useCallback(async () => {
    if (!rootRef.current) return;
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (rootRef.current.requestFullscreen) {
          await rootRef.current.requestFullscreen();
        } else if ((rootRef.current as any).webkitRequestFullscreen) {
          await (rootRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  // 3. Gyroscope / DeviceTilt Steering ("HP Miring/Tilt")
  const toggleTiltSteer = useCallback(async () => {
    if (!isTiltEnabled) {
      // iOS 13+ Accelerometer permission request
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            alert('Izin sensor gerak gyroscope ditolak oleh browser.');
            return;
          }
        } catch (e) {
          console.warn('Gyro permission error:', e);
        }
      }
      setIsTiltEnabled(true);
    } else {
      setIsTiltEnabled(false);
      // Reset steering inputs
      engineRef.current?.setInput('left', false);
      engineRef.current?.setInput('right', false);
      setTiltSteerAngle(0);
      tiltSteerRef.current = 0;
    }
  }, [isTiltEnabled]);

  useEffect(() => {
    if (!isTiltEnabled) return;

    const DEADZONE = 8.0; // 8 degrees deadzone for comfortable neutral hand position

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // Roll in portrait (-90 to 90)
      const beta = e.beta ?? 0;   // Pitch in portrait (-180 to 180)
      const angle = (window.screen?.orientation?.angle) ?? (window.orientation as number) ?? 0;

      let steer = 0;

      // Map device tilt according to landscape holding angle
      if (angle === 90) {
        steer = beta; // Tilting phone like steering wheel
      } else if (angle === -90 || angle === 270) {
        steer = -beta;
      } else {
        steer = gamma;
      }

      steer = Math.max(-50, Math.min(50, steer));
      tiltSteerRef.current = steer;

      if (steer < -DEADZONE) {
        engineRef.current?.setInput('left', true);
        engineRef.current?.setInput('right', false);
      } else if (steer > DEADZONE) {
        engineRef.current?.setInput('right', true);
        engineRef.current?.setInput('left', false);
      } else {
        engineRef.current?.setInput('left', false);
        engineRef.current?.setInput('right', false);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Throttle UI indicator updates (10 fps) to prevent react render overhead
    const timer = setInterval(() => {
      setTiltSteerAngle(Math.round(tiltSteerRef.current));
    }, 100);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      clearInterval(timer);
      engineRef.current?.setInput('left', false);
      engineRef.current?.setInput('right', false);
      setTiltSteerAngle(0);
      tiltSteerRef.current = 0;
    };
  }, [isTiltEnabled]);

  // 4. Initialize 3D Engine Facade
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

  // 5. Real-time 2D Canvas Radar Rendering Loop (60 FPS decoupled from React state)
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
      const pad = 10;
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
      ctx.fillText('N', cx, 7);
      ctx.fillText('S', cx, h - 7);
      ctx.fillText('W', 7, cy);
      ctx.fillText('E', w - 7, cy);

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
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Zone 2: North-East Commercial Trellis Rows (35, -32)
      for (let tr = -2; tr <= 2; tr++) {
        const rowZ = mapY(-32 + tr * 4.2);
        ctx.beginPath();
        ctx.moveTo(mapX(24), rowZ);
        ctx.lineTo(mapX(46), rowZ);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
        ctx.lineWidth = 1.4;
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

      // 5. Active Golden Collectibles
      const items = engineRef.current?.getActiveCollectibles() || [];
      items.forEach((it) => {
        const ix = mapX(it.x);
        const iy = mapY(it.z);
        ctx.beginPath();
        ctx.arc(ix, iy, 2.2, 0, Math.PI * 2);
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
      const headLen = 11;
      const tipX = px + Math.sin(p.heading) * headLen;
      const tipY = py + Math.cos(p.heading) * headLen;
      const leftWingX = px + Math.sin(p.heading + 2.4) * 5.5;
      const leftWingY = py + Math.cos(p.heading + 2.4) * 5.5;
      const rightWingX = px + Math.sin(p.heading - 2.4) * 5.5;
      const rightWingY = py + Math.cos(p.heading - 2.4) * 5.5;

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
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    };

    renderRadar();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [showMiniMap, miniMapExpanded, isMobileLandscape]);

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
    <div 
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : '100%',
        minHeight: isFullscreen ? '100vh' : 380,
        borderRadius: isFullscreen ? 0 : 24,
        overflow: 'hidden',
        background: '#070A12',
        border: isFullscreen ? 'none' : '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: isFullscreen ? 'none' : '0 20px 50px rgba(0, 0, 0, 0.6)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
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
          display: 'block',
          touchAction: 'none'
        }} 
      />

      {/* Top Floating Header & Status Bar */}
      <div style={{
        position: 'absolute',
        top: isMobileLandscape ? 8 : 14,
        left: isMobileLandscape ? 12 : 16,
        right: isMobileLandscape ? 12 : 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 20,
        gap: 8,
        flexWrap: 'nowrap'
      }}>
        {/* Left: Dynamic Horticultural Zone Indicator & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 1, overflow: 'hidden' }}>
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
              <Zap size={12} color={speedGauge > 50 ? '#FBBF24' : '#34D399'} />
              <span>SPD: <strong style={{ color: '#34D399' }}>{speedGauge}%</strong></span>
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
            onClick={toggleFullscreen}
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
            onClick={toggleTiltSteer}
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
            onClick={toggleCamera}
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
            onClick={toggleMascot}
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
            onClick={() => setShowMiniMap((prev) => !prev)}
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

          {/* Audio FX */}
          <button
            onClick={toggleAudio}
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
            onClick={() => setShowControlsGuide((prev) => !prev)}
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

      {/* Floating Tilt Horizon Level Indicator (When Sensor Miring is active) */}
      {isTiltEnabled && (
        <div style={{
          position: 'absolute',
          top: isMobileLandscape ? 50 : 64,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid #10B981',
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          zIndex: 25,
          pointerEvents: 'none'
        }}>
          <Smartphone size={12} color="#34D399" />
          <span>
            {tiltSteerAngle < -8 
              ? `◄ MIRING KIRI (${Math.abs(tiltSteerAngle)}°)` 
              : tiltSteerAngle > 8 
              ? `MIRING KANAN (${tiltSteerAngle}°) ►` 
              : `SEIMBANG (${tiltSteerAngle}°)`}
          </span>
        </div>
      )}

      {/* Floating Controls Guide Card */}
      {showControlsGuide && (
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
              onClick={() => setShowControlsGuide(false)}
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
          </ul>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTROLLER SECTION: ADAPTIVE MOBILE LANDSCAPE VS DESKTOP LAYOUT           */}
      {/* ========================================================================= */}

      {/* LEFT THUMB ZONE: Directional D-Pad (Up, Left, Down, Right) */}
      <div style={{
        position: 'absolute',
        bottom: isMobileLandscape ? 12 : 24,
        left: isMobileLandscape ? 14 : 24,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: isMobileLandscape ? '8px 10px' : '10px 14px',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        zIndex: 25,
        touchAction: 'none'
      }}>
        <span style={{ fontSize: 9, letterSpacing: '0.08em', color: '#94A3B8', fontFamily: 'monospace', fontWeight: 700 }}>
          {isMobileLandscape ? 'KIRI: ARAH' : 'WASD GAMEPAD'}
        </span>

        {/* Up Button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); handleVirtualInput('forward', true); }}
          onPointerUp={(e) => { e.preventDefault(); handleVirtualInput('forward', false); }}
          onPointerLeave={() => handleVirtualInput('forward', false)}
          onPointerCancel={() => handleVirtualInput('forward', false)}
          style={{
            width: isMobileLandscape ? 40 : 36,
            height: isMobileLandscape ? 40 : 36,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeKeys['w'] || activeKeys['arrowup'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#FFF',
            cursor: 'pointer',
            boxShadow: activeKeys['w'] ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
            touchAction: 'none'
          }}
          title="Maju (W)"
        >
          <ArrowUp size={20} />
        </button>

        {/* Left, Down, Right Horizontal Row */}
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); handleVirtualInput('left', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleVirtualInput('left', false); }}
            onPointerLeave={() => handleVirtualInput('left', false)}
            onPointerCancel={() => handleVirtualInput('left', false)}
            style={{
              width: isMobileLandscape ? 40 : 36,
              height: isMobileLandscape ? 40 : 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['a'] || activeKeys['arrowleft'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['a'] ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
              touchAction: 'none'
            }}
            title="Kiri (A)"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); handleVirtualInput('backward', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleVirtualInput('backward', false); }}
            onPointerLeave={() => handleVirtualInput('backward', false)}
            onPointerCancel={() => handleVirtualInput('backward', false)}
            style={{
              width: isMobileLandscape ? 40 : 36,
              height: isMobileLandscape ? 40 : 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['s'] || activeKeys['arrowdown'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['s'] ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
              touchAction: 'none'
            }}
            title="Mundur (S)"
          >
            <ArrowDown size={20} />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); handleVirtualInput('right', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleVirtualInput('right', false); }}
            onPointerLeave={() => handleVirtualInput('right', false)}
            onPointerCancel={() => handleVirtualInput('right', false)}
            style={{
              width: isMobileLandscape ? 40 : 36,
              height: isMobileLandscape ? 40 : 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['d'] || activeKeys['arrowright'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['d'] ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
              touchAction: 'none'
            }}
            title="Kanan (D)"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {/* On non-landscape/desktop: inline actions underneath D-pad */}
        {!isMobileLandscape && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
            <button
              onPointerDown={(e) => { e.preventDefault(); handleVirtualInput('turbo', true); }}
              onPointerUp={(e) => { e.preventDefault(); handleVirtualInput('turbo', false); }}
              onPointerLeave={() => handleVirtualInput('turbo', false)}
              onPointerCancel={() => handleVirtualInput('turbo', false)}
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
                touchAction: 'none'
              }}
              title="Turbo Sprint (Shift)"
            >
              <Zap size={11} />
              <span>TURBO</span>
            </button>

            <button
              onPointerDown={(e) => { e.preventDefault(); handleJump(); }}
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
                touchAction: 'none'
              }}
              title="Melompat (Spasi)"
            >
              JUMP
            </button>

            <button
              onPointerDown={(e) => { e.preventDefault(); handleSpin(); }}
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
                touchAction: 'none'
              }}
              title="360 Akrobatik Spin (E)"
            >
              SPIN
            </button>
          </div>
        )}
      </div>

      {/* RIGHT THUMB ZONE (In Mobile Landscape Mode): Dedicated Round Action Cluster */}
      {isMobileLandscape && (
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          zIndex: 25,
          pointerEvents: 'auto',
          touchAction: 'none'
        }}>
          {/* Reset Pill */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#CBD5E1',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={11} color="#34D399" />
            <span>Reset Posisi</span>
          </button>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Turbo Sprint (Round Blue) */}
            <button
              onPointerDown={(e) => { e.preventDefault(); handleVirtualInput('turbo', true); }}
              onPointerUp={(e) => { e.preventDefault(); handleVirtualInput('turbo', false); }}
              onPointerLeave={() => handleVirtualInput('turbo', false)}
              onPointerCancel={() => handleVirtualInput('turbo', false)}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeKeys['shift'] ? '#0284C7' : 'rgba(2, 132, 199, 0.35)',
                border: '2px solid #38BDF8',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                touchAction: 'none'
              }}
              title="Turbo Sprint (Shift)"
            >
              <Zap size={16} />
              <span style={{ fontSize: 8, fontWeight: 800 }}>TURBO</span>
            </button>

            {/* Acrobatic Spin (Round Rose) */}
            <button
              onPointerDown={(e) => { e.preventDefault(); handleSpin(); }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(225, 29, 72, 0.35)',
                border: '2px solid #FB7185',
                color: '#FDA4AF',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)',
                touchAction: 'none'
              }}
              title="360 Spin (E)"
            >
              <Sparkles size={16} />
              <span style={{ fontSize: 8, fontWeight: 800 }}>SPIN</span>
            </button>

            {/* Primary Jump (Large Round Emerald) */}
            <button
              onPointerDown={(e) => { e.preventDefault(); handleJump(); }}
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.45)',
                border: '2.5px solid #34D399',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                touchAction: 'none'
              }}
              title="Melompat (Spasi)"
            >
              <ArrowUp size={22} color="#34D399" />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#A7F3D0' }}>LOMPAT</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP RESET BUTTON (When NOT in mobile landscape mode) */}
      {!isMobileLandscape && (
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
      )}

      {/* 2D CANVAS RADAR MINI-MAP */}
      {showMiniMap && (
        <div style={{
          position: 'absolute',
          // On mobile landscape: docked in top-right to preserve bottom-right for thumb actions!
          top: isMobileLandscape ? 48 : 'auto',
          bottom: isMobileLandscape ? 'auto' : 24,
          right: isMobileLandscape ? 12 : 24,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: 6,
          borderRadius: 18,
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 22
        }}>
          {/* Radar Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '2px 4px',
            fontSize: 9,
            color: '#34D399',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontFamily: 'monospace'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Navigation size={10} color="#34D399" />
              <span>RADAR</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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
                {miniMapExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
              </button>
            </div>
          </div>

          {/* Radar 2D Viewport */}
          <canvas
            ref={radarCanvasRef}
            width={isMobileLandscape ? (miniMapExpanded ? 140 : 96) : (miniMapExpanded ? 190 : 136)}
            height={isMobileLandscape ? (miniMapExpanded ? 140 : 96) : (miniMapExpanded ? 190 : 136)}
            style={{
              borderRadius: 12,
              display: 'block',
              cursor: 'crosshair'
            }}
          />
        </div>
      )}
    </div>
  );
};
