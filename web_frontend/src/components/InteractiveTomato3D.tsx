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
import type { 
  CameraMode, 
  InputState, 
  RoomTransition, 
  InventoryItem, 
  InteractableTarget, 
  DialogueNode, 
  DialogueOption, 
  GuildQuest 
} from '../3d/types';

interface InteractiveTomato3DProps {
  onInteract?: (action: string) => void;
}

export const InteractiveTomato3D: React.FC<InteractiveTomato3DProps> = ({ onInteract }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerCoordsRef = useRef<{ x: number; z: number; heading: number }>({ x: 0, z: 0, heading: 0 });
  const speedTextRef = useRef<HTMLElement>(null);
  const tiltTextRef = useRef<HTMLSpanElement>(null);

  // Reactive UI States
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
  const tiltSteerRef = useRef<number>(0);

  // Agricultural Pest Combat Quest States
  const [questDefeated, setQuestDefeated] = useState<number>(0);
  const [isQuestCompleted, setIsQuestCompleted] = useState<boolean>(false);
  const [showQuestCelebration, setShowQuestCelebration] = useState<boolean>(false);

  // Room Transition & Inventory State
  const [roomTransition, setRoomTransition] = useState<RoomTransition | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [lootToasts, setLootToasts] = useState<{ id: number; name: string; icon: string; qty: number }[]>([]);
  const [useFeedback, setUseFeedback] = useState<string | null>(null);

  // Tavern RPG & Bounty Quest System State
  const [nearbyInteractable, setNearbyInteractable] = useState<InteractableTarget | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueNode | null>(null);
  const [isQuestBoardOpen, setIsQuestBoardOpen] = useState<boolean>(false);
  const [guildQuests, setGuildQuests] = useState<GuildQuest[]>([]);
  const [activeGuildQuest, setActiveGuildQuest] = useState<GuildQuest | null>(null);

  // 1. Detect Screen Orientation, Touch Capability, and Size Changes
  useEffect(() => {
    const handleViewportChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isShortHeight = window.innerHeight <= 620;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileWidth = window.innerWidth <= 1024;
      const isMobLand = isLandscape && (isShortHeight || (isTouch && isMobileWidth));
      setIsMobileLandscape(isMobLand);

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
      if (tiltTextRef.current) tiltTextRef.current.innerText = 'SEIMBANG (0°)';
      tiltSteerRef.current = 0;
    }
  }, [isTiltEnabled]);

  useEffect(() => {
    if (!isTiltEnabled) return;

    const DEADZONE = 6.0; // 6 degrees deadzone for responsive, natural tilt steering

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

    // Throttle UI indicator updates (10 fps) via direct DOM Ref (ZERO React re-renders)
    const timer = setInterval(() => {
      const angle = Math.round(tiltSteerRef.current);
      if (tiltTextRef.current) {
        tiltTextRef.current.innerText = angle < -6 
          ? `◄ MIRING KIRI (${Math.abs(angle)}°)` 
          : angle > 6 
          ? `MIRING KANAN (${angle}°) ►` 
          : `SEIMBANG (${angle}°)`;
      }
    }, 100);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      clearInterval(timer);
      engineRef.current?.setInput('left', false);
      engineRef.current?.setInput('right', false);
      if (tiltTextRef.current) tiltTextRef.current.innerText = 'SEIMBANG (0°)';
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
          if (speedTextRef.current) {
            speedTextRef.current.innerText = `${speedPercent}%`;
          }
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
        },
        onQuestUpdate: (defeated) => {
          setQuestDefeated(defeated);
        },
        onQuestComplete: () => {
          setIsQuestCompleted(true);
          setShowQuestCelebration(true);
          setTimeout(() => setShowQuestCelebration(false), 5500);
        },
        onRoomTransition: (transition) => {
          setRoomTransition(transition);
        },
        onInventoryUpdate: (items) => {
          setInventoryItems(items);
        },
        onItemLooted: (name, icon, qty) => {
          const toastId = Date.now() + Math.random();
          setLootToasts((prev) => [...prev.slice(-3), { id: toastId, name, icon, qty }]);
          setTimeout(() => {
            setLootToasts((prev) => prev.filter((t) => t.id !== toastId));
          }, 3200);
        },
        onInteractableChange: (target) => {
          setNearbyInteractable(target);
        },
        onOpenDialogue: (dialogue) => {
          setActiveDialogue(dialogue);
        },
        onOpenQuestBoard: (open) => {
          setIsQuestBoardOpen(open);
          if (open && engineRef.current) {
            setGuildQuests(engineRef.current.getGuildQuests());
            setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
          }
        },
        onActiveQuestChange: (quest) => {
          setActiveGuildQuest(quest);
          if (engineRef.current) {
            setGuildQuests(engineRef.current.getGuildQuests());
          }
        }
      }
    });

    engine.init(mountRef.current);
    engineRef.current = engine;
    setRemainingCollectibles(engine.getActiveCollectibles().length);
    setInventoryItems(engine.getInventory());
    setGuildQuests(engine.getGuildQuests());
    setActiveGuildQuest(engine.getActiveGuildQuest());

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
      if (key === 'e') {
        if (engine.hasNearbyInteractable()) {
          engine.triggerInteraction();
        } else {
          engine.triggerSpin();
        }
      }
      if (key === 'f' || key === 'j') engine.triggerSwordAttack();
      if (key === 'i' || key === 'b') {
        setIsInventoryOpen((prev) => !prev);
      }
      if (key === 'escape') {
        setIsInventoryOpen(false);
        setActiveDialogue(null);
        setIsQuestBoardOpen(false);
      }
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

  // 5. Real-time 2D Canvas Radar Rendering Loop (30 FPS throttled for mobile efficiency)
  useEffect(() => {
    if (!showMiniMap) return;
    let animId: number;
    let lastTime = 0;
    const interval = 1000 / 30; // 30 FPS cap

    const renderRadar = (timestamp: number = 0) => {
      animId = requestAnimationFrame(renderRadar);
      if (timestamp - lastTime < interval) return;
      lastTime = timestamp;

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
    setActiveKeys((prev) => {
      if (prev[key] === active) return prev;
      return { ...prev, [key]: active };
    });
  }, []);

  const handlePointerDown = useCallback((key: keyof InputState, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    handleVirtualInput(key, true);
  }, [handleVirtualInput]);

  const handlePointerUp = useCallback((key: keyof InputState, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
    handleVirtualInput(key, false);
  }, [handleVirtualInput]);

  const handleJump = useCallback(() => {
    engineRef.current?.triggerJump();
  }, []);

  const handleSpin = useCallback(() => {
    engineRef.current?.triggerSpin();
  }, []);

  const handleSwordAttack = useCallback(() => {
    engineRef.current?.triggerSwordAttack();
  }, []);

  const handleUseItem = useCallback((itemId: string) => {
    const res = engineRef.current?.useInventoryItem(itemId);
    if (res?.message) {
      setUseFeedback(res.message);
      setTimeout(() => setUseFeedback(null), 2500);
    }
  }, []);

  const handleEquipWeapon = useCallback((itemId: string) => {
    const res = engineRef.current?.equipInventoryWeapon(itemId);
    if (res?.message) {
      setUseFeedback(res.message);
      setTimeout(() => setUseFeedback(null), 2500);
    }
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.resetCharacter();
    if (engineRef.current) {
      setRemainingCollectibles(engineRef.current.getActiveCollectibles().length);
    }
  }, []);

  const handleTriggerInteraction = useCallback(() => {
    engineRef.current?.triggerInteraction();
  }, []);

  const handleSelectDialogueOption = useCallback((option: DialogueOption) => {
    engineRef.current?.selectDialogueOption(option);
  }, []);

  const handleCloseDialogue = useCallback(() => {
    engineRef.current?.closeDialogue();
    setActiveDialogue(null);
  }, []);

  const handleAcceptQuest = useCallback((questId: string) => {
    const success = engineRef.current?.acceptQuest(questId);
    if (success && engineRef.current) {
      setGuildQuests(engineRef.current.getGuildQuests());
      setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
    }
  }, []);

  const handleClaimQuestReward = useCallback((questId: string) => {
    const success = engineRef.current?.claimQuestReward(questId);
    if (success && engineRef.current) {
      setGuildQuests(engineRef.current.getGuildQuests());
      setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
    }
  }, []);

  const handleCloseQuestBoard = useCallback(() => {
    engineRef.current?.closeQuestBoard();
    setIsQuestBoardOpen(false);
  }, []);

  const isImmersive = isFullscreen || isMobileLandscape;

  return (
    <div 
      ref={rootRef}
      style={{
        position: isImmersive ? 'fixed' : 'relative',
        top: isImmersive ? 0 : undefined,
        left: isImmersive ? 0 : undefined,
        right: isImmersive ? 0 : undefined,
        bottom: isImmersive ? 0 : undefined,
        width: isImmersive ? '100vw' : '100%',
        height: isImmersive ? '100vh' : '100%',
        zIndex: isImmersive ? 99999 : 1,
        borderRadius: isImmersive ? 0 : 24,
        overflow: 'hidden',
        background: '#070A12',
        border: isImmersive ? 'none' : '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: isImmersive ? 'none' : '0 20px 50px rgba(0, 0, 0, 0.6)',
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
              <Zap size={12} color="#34D399" />
              <span>SPD: <strong ref={speedTextRef} style={{ color: '#34D399' }}>0%</strong></span>
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

          {/* Inventory Bag Toggle Button */}
          <button
            onClick={() => setIsInventoryOpen((prev) => !prev)}
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
            {!isMobileLandscape && <span>Tas ({inventoryItems.length}/16)</span>}
          </button>

          {/* Guild Bounty Board Button */}
          <button
            onClick={() => {
              setIsQuestBoardOpen((prev) => {
                const next = !prev;
                if (next && engineRef.current) {
                  setGuildQuests(engineRef.current.getGuildQuests());
                  setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
                }
                return next;
              });
            }}
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


      {/* ⚔️ / 📜 ACTIVE GUILD BOUNTY HUD */}
      <div 
        onClick={() => {
          setIsQuestBoardOpen(true);
          if (engineRef.current) {
            setGuildQuests(engineRef.current.getGuildQuests());
            setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
          }
        }}
        style={{
          position: 'absolute',
          top: isMobileLandscape ? 8 : 64,
          left: 12,
          background: activeGuildQuest?.status === 'completed' 
            ? 'rgba(6, 78, 59, 0.88)' 
            : 'rgba(15, 23, 42, 0.85)',
          border: activeGuildQuest?.status === 'completed'
            ? '1px solid #34D399'
            : '1px solid rgba(234, 179, 8, 0.5)',
          borderRadius: 14,
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: isQuestCompleted ? '0 4px 16px rgba(16, 185, 129, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
          zIndex: 22,
          pointerEvents: 'auto',
          cursor: 'pointer',
          maxWidth: 290
        }}
        title="Klik untuk membuka Papan Sayembara Serikat Tani"
      >
        <span style={{ fontSize: 17 }}>
          {activeGuildQuest?.status === 'completed' ? '🏆' : (activeGuildQuest?.icon || '⚔️')}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: activeGuildQuest?.status === 'completed' ? '#34D399' : '#FBBF24',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {activeGuildQuest ? activeGuildQuest.title : 'Bounty: Basmi Hama Kebun'}
            </span>
            <span style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 700 }}>
              [PAPAN]
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10.5, color: '#E2E8F0', fontWeight: 600 }}>
              {activeGuildQuest 
                ? `${activeGuildQuest.currentCount} / ${activeGuildQuest.targetCount} ${activeGuildQuest.category === 'bounty' ? 'Hama' : activeGuildQuest.category === 'gathering' ? 'Embun' : 'Survei'}`
                : `${questDefeated} / 5 Hama Dikalahkan`}
            </span>
            {activeGuildQuest && (
              <span style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: activeGuildQuest.currentCount >= activeGuildQuest.targetCount ? '#34D399' : '#FEF08A'
              }}>
                {activeGuildQuest.currentCount >= activeGuildQuest.targetCount 
                  ? (activeGuildQuest.status === 'completed' ? 'Tuntas' : 'Siap Klaim!') 
                  : `+${activeGuildQuest.rewardScore}`}
              </span>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{ width: 40, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: activeGuildQuest 
              ? `${Math.min(100, (activeGuildQuest.currentCount / activeGuildQuest.targetCount) * 100)}%` 
              : `${(questDefeated / 5) * 100}%`,
            height: '100%',
            background: (activeGuildQuest?.currentCount || questDefeated) >= (activeGuildQuest?.targetCount || 5)
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* 🎉 Quest Complete Celebration Banner */}
      {showQuestCelebration && (
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '2px solid #6EE7B7',
          borderRadius: 20,
          padding: '16px 28px',
          color: '#FFFFFF',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)',
          zIndex: 40,
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎉 🏆 🍅</div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.5px' }}>
            BOUNTY QUEST COMPLETED!
          </div>
          <div style={{ fontSize: 12, opacity: 0.95, marginTop: 4 }}>
            Seluruh 5 Hama Kebun Berhasil Dihalau • +500 Bonus Skor
          </div>
        </div>
      )}

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
          <span ref={tiltTextRef}>SEIMBANG (0°)</span>
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
        bottom: isMobileLandscape ? 14 : 24,
        left: isMobileLandscape ? 16 : 24,
        background: 'rgba(15, 23, 42, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: isMobileLandscape ? '10px 12px' : '10px 14px',
        borderRadius: 22,
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        zIndex: 25,
        touchAction: 'none'
      }}>
        <span style={{ fontSize: 9, letterSpacing: '0.08em', color: '#94A3B8', fontFamily: 'monospace', fontWeight: 700 }}>
          {isMobileLandscape ? 'KIRI: ARAH' : 'WASD GAMEPAD'}
        </span>

        {/* Up Button */}
        <button
          onPointerDown={(e) => handlePointerDown('forward', e)}
          onPointerUp={(e) => handlePointerUp('forward', e)}
          onPointerCancel={(e) => handlePointerUp('forward', e)}
          style={{
            width: isMobileLandscape ? 50 : 44,
            height: isMobileLandscape ? 50 : 44,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeKeys['forward'] || activeKeys['w'] || activeKeys['arrowup'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
            border: '1.5px solid rgba(255, 255, 255, 0.22)',
            color: '#FFF',
            cursor: 'pointer',
            boxShadow: activeKeys['forward'] || activeKeys['w'] ? '0 0 16px rgba(16, 185, 129, 0.6)' : 'none',
            touchAction: 'none'
          }}
          title="Maju (W)"
        >
          <ArrowUp size={24} />
        </button>

        {/* Left, Down, Right Horizontal Row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onPointerDown={(e) => handlePointerDown('left', e)}
            onPointerUp={(e) => handlePointerUp('left', e)}
            onPointerCancel={(e) => handlePointerUp('left', e)}
            style={{
              width: isMobileLandscape ? 50 : 44,
              height: isMobileLandscape ? 50 : 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['left'] || activeKeys['a'] || activeKeys['arrowleft'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['left'] || activeKeys['a'] ? '0 0 16px rgba(16, 185, 129, 0.6)' : 'none',
              touchAction: 'none'
            }}
            title="Kiri (A)"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onPointerDown={(e) => handlePointerDown('backward', e)}
            onPointerUp={(e) => handlePointerUp('backward', e)}
            onPointerCancel={(e) => handlePointerUp('backward', e)}
            style={{
              width: isMobileLandscape ? 50 : 44,
              height: isMobileLandscape ? 50 : 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['backward'] || activeKeys['s'] || activeKeys['arrowdown'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['backward'] || activeKeys['s'] ? '0 0 16px rgba(16, 185, 129, 0.6)' : 'none',
              touchAction: 'none'
            }}
            title="Mundur (S)"
          >
            <ArrowDown size={24} />
          </button>
          <button
            onPointerDown={(e) => handlePointerDown('right', e)}
            onPointerUp={(e) => handlePointerUp('right', e)}
            onPointerCancel={(e) => handlePointerUp('right', e)}
            style={{
              width: isMobileLandscape ? 50 : 44,
              height: isMobileLandscape ? 50 : 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeKeys['right'] || activeKeys['d'] || activeKeys['arrowright'] ? '#10B981' : 'rgba(30, 41, 59, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: activeKeys['right'] || activeKeys['d'] ? '0 0 16px rgba(16, 185, 129, 0.6)' : 'none',
              touchAction: 'none'
            }}
            title="Kanan (D)"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        {/* On desktop/portrait mode: inline actions underneath D-pad */}
        {!isMobileLandscape && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
            <button
              onPointerDown={(e) => handlePointerDown('turbo', e)}
              onPointerUp={(e) => handlePointerUp('turbo', e)}
              onPointerCancel={(e) => handlePointerUp('turbo', e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 28,
                padding: '0 8px',
                borderRadius: 8,
                background: activeKeys['turbo'] || activeKeys['shift'] ? '#0284C7' : 'rgba(2, 132, 199, 0.25)',
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
                height: 28,
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
                height: 28,
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

            <button
              onPointerDown={(e) => { e.preventDefault(); handleSwordAttack(); }}
              style={{
                height: 28,
                padding: '0 8px',
                borderRadius: 8,
                background: 'rgba(234, 179, 8, 0.25)',
                border: '1px solid #FDE047',
                color: '#FEF08A',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'none'
              }}
              title="Tebas Pedang Daun Botani (F)"
            >
              ⚔️ TEBAS
            </button>
          </div>
        )}
      </div>

      {/* RIGHT THUMB ZONE (In Mobile Landscape Mode): Dedicated Round Action Cluster */}
      {isMobileLandscape && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
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
              padding: '5px 12px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.90)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#CBD5E1',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} color="#34D399" />
            <span>Reset Posisi</span>
          </button>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* If Tilt steering is ON: Dedicated GAS/PEDAL MAJU Button */}
            {isTiltEnabled && (
              <button
                onPointerDown={(e) => handlePointerDown('forward', e)}
                onPointerUp={(e) => handlePointerUp('forward', e)}
                onPointerCancel={(e) => handlePointerUp('forward', e)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: activeKeys['forward'] ? '#059669' : 'rgba(16, 185, 129, 0.45)',
                  border: '2.5px solid #34D399',
                  color: '#FFF',
                  cursor: 'pointer',
                  boxShadow: activeKeys['forward'] ? '0 0 18px rgba(16, 185, 129, 0.7)' : '0 4px 14px rgba(16, 185, 129, 0.35)',
                  touchAction: 'none'
                }}
                title="Tahan untuk Gas / Melaju (Tilt Mode)"
              >
                <Zap size={18} color="#A7F3D0" />
                <span style={{ fontSize: 9, fontWeight: 900, color: '#A7F3D0' }}>GAS</span>
              </button>
            )}

            {/* Turbo Sprint (Round Blue) */}
            <button
              onPointerDown={(e) => handlePointerDown('turbo', e)}
              onPointerUp={(e) => handlePointerUp('turbo', e)}
              onPointerCancel={(e) => handlePointerUp('turbo', e)}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeKeys['turbo'] ? '#0284C7' : 'rgba(2, 132, 199, 0.35)',
                border: '2px solid #38BDF8',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: activeKeys['turbo'] ? '0 0 16px rgba(56, 189, 248, 0.7)' : '0 4px 14px rgba(2, 132, 199, 0.35)',
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
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(225, 29, 72, 0.35)',
                border: '2px solid #FB7185',
                color: '#FDA4AF',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                touchAction: 'none'
              }}
              title="Serang Putar Spin (E)"
            >
              <Sparkles size={16} />
              <span style={{ fontSize: 7.5, fontWeight: 800 }}>PUTAR</span>
            </button>

            {/* Sword Melee Attack (Round Amber) */}
            <button
              onPointerDown={(e) => { e.preventDefault(); handleSwordAttack(); }}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.8), rgba(239, 68, 68, 0.8))',
                border: '2.5px solid #FDE047',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(234, 179, 8, 0.55)',
                touchAction: 'none'
              }}
              title="Tebas Pedang Daun Botani (F)"
            >
              <span style={{ fontSize: 16 }}>⚔️</span>
              <span style={{ fontSize: 7.5, fontWeight: 900, color: '#FEF08A' }}>TEBAS</span>
            </button>

            {/* Primary Jump (Large Round Emerald) */}
            <button
              onPointerDown={(e) => { e.preventDefault(); handleJump(); }}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.55)',
                border: '3px solid #34D399',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: '0 6px 22px rgba(16, 185, 129, 0.55)',
                touchAction: 'none'
              }}
              title="Melompat (Spasi)"
            >
              <ArrowUp size={24} color="#34D399" />
              <span style={{ fontSize: 10, fontWeight: 900, color: '#A7F3D0' }}>LOMPAT</span>
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

      {/* 🎁 FLOATING LOOT TOAST NOTIFICATIONS */}
      <div style={{
        position: 'absolute',
        top: isMobileLandscape ? 84 : 96,
        left: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 35,
        pointerEvents: 'none'
      }}>
        {lootToasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(15, 23, 42, 0.94)',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 12,
              padding: '6px 12px',
              color: '#F8FAFC',
              fontSize: 11,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)'
            }}
          >
            <span style={{ fontSize: 16 }}>{toast.icon}</span>
            <span>
              +{toast.qty} <strong style={{ color: '#34D399' }}>{toast.name}</strong> masuk ke tas!
            </span>
          </div>
        ))}
      </div>

      {/* 🎒 16-SLOT RPG INVENTORY MODAL */}
      {isInventoryOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(3, 7, 18, 0.78)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 80,
          padding: isMobileLandscape ? 12 : 20,
          pointerEvents: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: isMobileLandscape ? 680 : 560,
            maxHeight: isMobileLandscape ? '94vh' : '88vh',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1.5px solid rgba(52, 211, 153, 0.4)',
            borderRadius: 24,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(30, 41, 59, 0.45)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🎒</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.03em' }}>
                    TAS & INVENTORI PETANI
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    Slot Terisi: {inventoryItems.length} / 16 • Tekan [I] atau [Esc] untuk tutup
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsInventoryOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#CBD5E1',
                  padding: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Tabs */}
            <div style={{
              display: 'flex',
              gap: 6,
              padding: '8px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              overflowX: 'auto'
            }}>
              {[
                { id: 'all', label: 'Semua', icon: '📦' },
                { id: 'weapon', label: 'Senjata', icon: '🗡️' },
                { id: 'produce', label: 'Panen', icon: '🌱' },
                { id: 'consumable', label: 'Konsumsi', icon: '🧪' },
                { id: 'loot', label: 'Loot Hama', icon: '🪲' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryFilter(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    background: activeCategoryFilter === tab.id ? '#10B981' : 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${activeCategoryFilter === tab.id ? '#34D399' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: '#FFF',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Body: Left Grid + Right Inspector */}
            <div style={{
              display: 'flex',
              flexDirection: isMobileLandscape ? 'row' : 'column',
              padding: 16,
              gap: 14,
              overflowY: 'auto'
            }}>
              {/* 16-Slot Grid */}
              <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8
              }}>
                {Array.from({ length: 16 }).map((_, index) => {
                  const filtered = activeCategoryFilter === 'all' 
                    ? inventoryItems 
                    : inventoryItems.filter(i => i.category === activeCategoryFilter);
                  const item = filtered[index];
                  const isSelected = selectedItem && item && selectedItem.id === item.id;

                  if (!item) {
                    return (
                      <div
                        key={`empty_${index}`}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 14,
                          background: 'rgba(30, 41, 59, 0.25)',
                          border: '1.5px dashed rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255, 255, 255, 0.12)',
                          fontSize: 11,
                          fontFamily: 'monospace'
                        }}
                      >
                        {index + 1}
                      </div>
                    );
                  }

                  const rarityBorder = 
                    item.rarity === 'legendary' ? '#F59E0B' :
                    item.rarity === 'epic' ? '#A855F7' :
                    item.rarity === 'rare' ? '#38BDF8' : '#10B981';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 14,
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                        border: `2px solid ${isSelected ? '#34D399' : rarityBorder}`,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{item.icon}</span>
                      {item.count > 1 && (
                        <span style={{
                          position: 'absolute',
                          bottom: 3,
                          right: 5,
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#FFF',
                          background: 'rgba(0, 0, 0, 0.8)',
                          padding: '1px 5px',
                          borderRadius: 6
                        }}>
                          x{item.count}
                        </span>
                      )}
                      {item.isEquipped && (
                        <span style={{
                          position: 'absolute',
                          top: 3,
                          left: 4,
                          fontSize: 8,
                          fontWeight: 900,
                          color: '#FDE047',
                          background: 'rgba(0, 0, 0, 0.85)',
                          padding: '1px 4px',
                          borderRadius: 4,
                          border: '1px solid #EAB308'
                        }}>
                          E
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Item Inspector Pane */}
              <div style={{
                width: isMobileLandscape ? 230 : '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {selectedItem ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{selectedItem.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
                          {selectedItem.name}
                        </div>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: selectedItem.rarity === 'epic' ? '#C084FC' : selectedItem.rarity === 'rare' ? '#38BDF8' : '#34D399'
                        }}>
                          {selectedItem.rarity} • {selectedItem.category}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', lineHeight: 1.45, marginBottom: 10 }}>
                      {selectedItem.description}
                    </div>
                    {selectedItem.attackBonus && (
                      <div style={{ fontSize: 11, color: '#F87171', fontWeight: 700, marginBottom: 4 }}>
                        ⚔️ Bonus Serangan: +{selectedItem.attackBonus} ATK
                      </div>
                    )}
                    {selectedItem.speedBonus && (
                      <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, marginBottom: 4 }}>
                        ⚡ Dorongan Gerak: +{Math.round(selectedItem.speedBonus * 100)}% SPD
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', margin: 'auto 0' }}>
                    Pilih item di tas untuk melihat rincian & menggunakan.
                  </div>
                )}

                {/* Action Button inside Inspector */}
                {selectedItem && (
                  <div style={{ marginTop: 10 }}>
                    {selectedItem.category === 'weapon' ? (
                      <button
                        disabled={selectedItem.isEquipped}
                        onClick={() => handleEquipWeapon(selectedItem.id)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          background: selectedItem.isEquipped ? 'rgba(100, 116, 139, 0.4)' : '#0284C7',
                          border: 'none',
                          color: '#FFF',
                          cursor: selectedItem.isEquipped ? 'default' : 'pointer'
                        }}
                      >
                        {selectedItem.isEquipped ? '✓ Terpasang' : 'Pasang Senjata'}
                      </button>
                    ) : selectedItem.category === 'consumable' ? (
                      <button
                        onClick={() => handleUseItem(selectedItem.id)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#10B981',
                          border: 'none',
                          color: '#FFF',
                          cursor: 'pointer'
                        }}
                      >
                        Gunakan Item
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Action feedback message */}
            {useFeedback && (
              <div style={{
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.2)',
                borderTop: '1px solid rgba(16, 185, 129, 0.4)',
                fontSize: 11,
                color: '#34D399',
                textAlign: 'center',
                fontWeight: 600
              }}>
                {useFeedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💬 FLOATING PROMPT PILL (NPC / BOUNTY BOARD INTERACTION) */}
      {nearbyInteractable && !activeDialogue && !isQuestBoardOpen && (
        <div style={{
          position: 'absolute',
          bottom: isMobileLandscape ? 20 : 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          pointerEvents: 'auto'
        }}>
          <button
            onClick={handleTriggerInteraction}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.95), rgba(202, 138, 4, 0.95))',
              border: '2px solid #FEF08A',
              borderRadius: 30,
              color: '#1C1917',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.3px',
              boxShadow: '0 6px 24px rgba(234, 179, 8, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <span style={{
              background: '#1C1917',
              color: '#FEF08A',
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 900
            }}>
              E
            </span>
            <span>{nearbyInteractable.promptText}</span>
          </button>
        </div>
      )}

      {/* 💬 RPG DIALOGUE MODAL */}
      {activeDialogue && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDialogue();
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(5, 5, 10, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: isMobileLandscape ? 'center' : 'flex-end',
            justifyContent: 'center',
            padding: isMobileLandscape ? 12 : 24,
            zIndex: 100,
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: 640,
            background: 'linear-gradient(145deg, rgba(30, 22, 16, 0.96), rgba(15, 23, 42, 0.98))',
            border: '2px solid rgba(234, 179, 8, 0.6)',
            borderRadius: 20,
            padding: isMobileLandscape ? 14 : 20,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(234, 179, 8, 0.2)',
            color: '#FFF',
            position: 'relative'
          }}>
            {/* Header with Avatar & Speaker Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(16, 185, 129, 0.2))',
                border: '2px solid #FBBF24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
              }}>
                {activeDialogue.speakerAvatar || activeDialogue.speakerIcon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FEF08A', letterSpacing: '0.4px' }}>
                  {activeDialogue.speakerName || activeDialogue.speaker}
                </div>
                {activeDialogue.speakerTitle && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {activeDialogue.speakerTitle}
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseDialogue}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Speech Text */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: isMobileLandscape ? 12 : 13.5,
              lineHeight: 1.6,
              color: '#F1F5F9',
              fontStyle: 'italic'
            }}>
              "{activeDialogue.text}"
            </div>

            {/* Dialogue Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeDialogue.options.map((opt, i) => {
                const isBountyAction = opt.action === 'open_bounty_board' || opt.action === 'open_quest_board';
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectDialogueOption(opt)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: isBountyAction 
                        ? 'linear-gradient(90deg, rgba(234, 179, 8, 0.25), rgba(202, 138, 4, 0.15))'
                        : 'rgba(255, 255, 255, 0.06)',
                      border: isBountyAction
                        ? '1px solid rgba(234, 179, 8, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isBountyAction ? '#FEF08A' : '#E2E8F0',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ color: '#FBBF24', fontSize: 13 }}>▸</span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 📜 GUILD BOUNTY BOARD MODAL */}
      {isQuestBoardOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseQuestBoard();
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 90,
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: 720,
            maxHeight: '90vh',
            background: 'linear-gradient(145deg, rgba(28, 20, 14, 0.97), rgba(15, 23, 42, 0.98))',
            border: '2px solid #D97706',
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(217, 119, 6, 0.25)',
            color: '#FFF'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>📜</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FEF08A', letterSpacing: '0.4px' }}>
                    Papan Sayembara Serikat Tani
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    Pusat Kontrak Pemburu Hama & Ekspedisi Kebun Holtikultura
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseQuestBoard}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Quests Cards List */}
            <div style={{
              padding: '16px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {guildQuests.map((quest) => {
                const isQuestActive = quest.status === 'active';
                const isCompleted = quest.status === 'completed';
                const curCount = quest.currentCount;
                const canClaim = isQuestActive && curCount >= quest.targetCount;
                const progressPct = Math.min(100, Math.round((curCount / quest.targetCount) * 100));

                return (
                  <div
                    key={quest.id}
                    style={{
                      background: isQuestActive 
                        ? 'rgba(30, 41, 59, 0.7)' 
                        : isCompleted
                        ? 'rgba(6, 78, 59, 0.35)'
                        : 'rgba(15, 23, 42, 0.55)',
                      border: isCompleted
                        ? '1px solid #10B981'
                        : isQuestActive
                        ? '1px solid #38BDF8'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 16,
                      padding: 14,
                      display: 'flex',
                      flexDirection: isMobileLandscape ? 'row' : 'column',
                      alignItems: isMobileLandscape ? 'center' : 'stretch',
                      gap: 12,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Icon & Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22
                      }}>
                        {quest.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
                            {quest.title}
                          </span>
                          <span style={{ fontSize: 11, color: '#FBBF24' }}>
                            {'⭐'.repeat(quest.difficulty || 1)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4, marginBottom: 6 }}>
                          {quest.description}
                        </div>

                        {/* Progress and Rewards Row */}
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 600 }}>
                              Target: {curCount}/{quest.targetCount} ({progressPct}%)
                            </span>
                            <div style={{ width: 60, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                width: `${progressPct}%`,
                                height: '100%',
                                background: canClaim || isCompleted ? '#34D399' : '#38BDF8',
                                transition: 'width 0.3s'
                              }} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
                            <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                              🏆 +{quest.rewardScore} Skor
                            </span>
                            {quest.rewardItemName && (
                              <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                                • 🎁 {quest.rewardItemName} x{quest.rewardItemQty || 1}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div style={{ minWidth: 140, display: 'flex', justifyContent: 'flex-end' }}>
                      {isCompleted ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid #10B981',
                            color: '#34D399',
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          ✓ Selesai
                        </button>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleClaimQuestReward(quest.id)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            border: '1px solid #FDE047',
                            color: '#FFF',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 0 16px rgba(245, 158, 11, 0.5)'
                          }}
                        >
                          🎁 Klaim Hadiah!
                        </button>
                      ) : isQuestActive ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'rgba(56, 189, 248, 0.2)',
                            border: '1px solid #38BDF8',
                            color: '#38BDF8',
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          ⚔️ Sedang Berjalan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAcceptQuest(quest.id)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            border: 'none',
                            color: '#FFF',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          📜 Terima Kontrak
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🚪 CINEMATIC ROOM TRANSITION LOADING SCREEN */}
      {roomTransition?.isTransitioning && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, #030712 75%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'all',
          color: '#FFF',
          textAlign: 'center',
          padding: 24
        }}>
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '2px solid #34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            boxShadow: '0 0 32px rgba(16, 185, 129, 0.5)',
            marginBottom: 16
          }}>
            {roomTransition.icon}
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.4px',
            color: '#F8FAFC',
            marginBottom: 6,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)'
          }}>
            {roomTransition.title}
          </div>
          <div style={{
            fontSize: 12,
            color: '#94A3B8',
            maxWidth: 420,
            lineHeight: 1.5,
            marginBottom: 20
          }}>
            {roomTransition.subtitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(52, 211, 153, 0.25)',
              borderTopColor: '#34D399',
              borderRadius: '50%'
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: '0.06em' }}>
              MEMASUKI WILAYAH...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
