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
  MapPin
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

  // UI Button Handlers
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
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-emerald-500/20 bg-slate-950 shadow-2xl select-none group">
      {/* 3D WebGL Canvas Mounting Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Navigation & Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* Left: Dynamic Horticultural Zone Indicator & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-emerald-500/30 text-white shadow-lg pointer-events-auto">
            <MapPin className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-emerald-200">
              {currentZone}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white/90 text-xs shadow-lg pointer-events-auto">
            <div className="flex items-center gap-1.5 font-mono">
              <Zap className={`w-3.5 h-3.5 ${speedGauge > 50 ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
              <span>SPD: <strong className="text-emerald-300">{speedGauge}%</strong></span>
            </div>
            <div className="w-[1px] h-3 bg-white/20" />
            <div className="flex items-center gap-1.5 font-mono">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>BOUNCES: <strong className="text-rose-300">{bounces}</strong></span>
            </div>
            <div className="w-[1px] h-3 bg-white/20" />
            <div className="flex items-center gap-1.5 font-mono">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>SCORE: <strong className="text-amber-300">{score}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Engine Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all ${
              cameraMode === 'chase'
                ? 'bg-slate-900/80 border-white/20 text-white/90 hover:bg-slate-800'
                : 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
            }`}
            title="Ganti Mode Kamera"
          >
            <CameraIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{cameraMode === 'chase' ? 'Chase Cam' : 'Orbit Cam'}</span>
          </button>

          <button
            onClick={toggleMascot}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all ${
              mascotMode
                ? 'bg-rose-500/80 border-rose-400 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-900/80 border-white/20 text-white/70 hover:bg-slate-800'
            }`}
            title="Toggle Wajah Maskot"
          >
            {mascotMode ? <Smile className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">Mascot Face</span>
          </button>

          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all ${
              isAudioEnabled
                ? 'bg-emerald-500/80 border-emerald-400 text-white'
                : 'bg-slate-900/80 border-white/20 text-white/60 hover:bg-slate-800'
            }`}
            title={isAudioEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowControlsGuide((prev) => !prev)}
            className="p-2 rounded-xl text-xs font-medium bg-slate-900/80 border border-white/20 text-white/80 hover:bg-slate-800 transition-all"
            title="Panduan Kontrol"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help Modal Guide */}
      {showControlsGuide && (
        <div className="absolute top-16 right-4 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-xs text-slate-200 shadow-2xl z-20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white text-sm">🎮 Kontrol Eksplorasi 3D</span>
            <button
              onClick={() => setShowControlsGuide(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1.5 text-slate-300">
            <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-white">W A S D</kbd> / Panah: Gerakkan Tomat</li>
            <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-white">Spasi</kbd>: Lompat & Pantulkan Buah</li>
            <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-white">Shift</kbd>: Turbo Boost Sprint</li>
            <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-white">E</kbd>: Spin Trick (+50 Poin)</li>
            <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10 text-white">R</kbd>: Reset Posisi Awal</li>
          </ul>
          <p className="mt-2.5 text-[10px] text-emerald-400 font-medium">
            💡 Kunjungi Greenhouse dan kumpulkan tomat emas di padang rumput!
          </p>
        </div>
      )}

      {/* Bottom Virtual Gamepad & Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-10">
        {/* On-Screen Touch D-Pad */}
        <div className="bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-0.5">WASD Gamepad</span>
          <button
            onPointerDown={() => handleVirtualInput('forward', true)}
            onPointerUp={() => handleVirtualInput('forward', false)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeKeys['w'] || activeKeys['arrowup'] ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white/80 active:bg-slate-700'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            <button
              onPointerDown={() => handleVirtualInput('left', true)}
              onPointerUp={() => handleVirtualInput('left', false)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeKeys['a'] || activeKeys['arrowleft'] ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white/80 active:bg-slate-700'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => handleVirtualInput('backward', true)}
              onPointerUp={() => handleVirtualInput('backward', false)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeKeys['s'] || activeKeys['arrowdown'] ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white/80 active:bg-slate-700'
              }`}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => handleVirtualInput('right', true)}
              onPointerUp={() => handleVirtualInput('right', false)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeKeys['d'] || activeKeys['arrowright'] ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white/80 active:bg-slate-700'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {/* Quick Action Triggers */}
          <div className="flex gap-1.5 mt-1">
            <button
              onPointerDown={() => handleVirtualInput('turbo', true)}
              onPointerUp={() => handleVirtualInput('turbo', false)}
              className="px-2.5 py-1 rounded-lg bg-sky-600/80 active:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Turbo
            </button>
            <button
              onClick={handleJump}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/80 active:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider"
            >
              Jump
            </button>
            <button
              onClick={handleSpin}
              className="px-2.5 py-1 rounded-lg bg-rose-600/80 active:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider"
            >
              Spin
            </button>
          </div>
        </div>

        {/* Reset Position Button */}
        <div className="pointer-events-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-slate-800 transition-all shadow-xl text-xs font-semibold"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Reset Posisi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
