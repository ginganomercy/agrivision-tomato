import React, { useEffect, useRef, useState, useCallback } from 'react';
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

import { HUDStatusBar } from './tomato3d/HUDStatusBar';
import { ActiveQuestWidget } from './tomato3d/ActiveQuestWidget';
import { TiltIndicator } from './tomato3d/TiltIndicator';
import { VirtualGamepad } from './tomato3d/VirtualGamepad';
import { MiniMapRadar } from './tomato3d/MiniMapRadar';
import { LootToastContainer } from './tomato3d/LootToastContainer';
import { FloatingInteractButton } from './tomato3d/FloatingInteractButton';
import { ControlsGuideModal } from './tomato3d/modals/ControlsGuideModal';
import { DialogueModal } from './tomato3d/modals/DialogueModal';
import { BountyBoardModal } from './tomato3d/modals/BountyBoardModal';
import { InventoryModal } from './tomato3d/modals/InventoryModal';
import { RoomTransitionModal } from './tomato3d/modals/RoomTransitionModal';

interface InteractiveTomato3DProps {
  onInteract?: (action: string) => void;
}

export const InteractiveTomato3D: React.FC<InteractiveTomato3DProps> = ({ onInteract }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
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
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      const angle = (window.screen?.orientation?.angle) ?? (window.orientation as number) ?? 0;

      let steer = 0;
      if (angle === 90) {
        steer = beta;
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
      <HUDStatusBar
        currentZone={currentZone}
        bounces={bounces}
        score={score}
        isMobileLandscape={isMobileLandscape}
        isFullscreen={isFullscreen}
        isTiltEnabled={isTiltEnabled}
        cameraMode={cameraMode}
        mascotMode={mascotMode}
        showMiniMap={showMiniMap}
        isInventoryOpen={isInventoryOpen}
        inventoryCount={inventoryItems.length}
        isQuestBoardOpen={isQuestBoardOpen}
        isAudioEnabled={isAudioEnabled}
        speedTextRef={speedTextRef}
        onToggleFullscreen={toggleFullscreen}
        onToggleTiltSteer={toggleTiltSteer}
        onToggleCamera={toggleCamera}
        onToggleMascot={toggleMascot}
        onToggleMiniMap={() => setShowMiniMap((prev) => !prev)}
        onToggleInventory={() => setIsInventoryOpen((prev) => !prev)}
        onToggleQuestBoard={() => {
          setIsQuestBoardOpen((prev) => {
            const next = !prev;
            if (next && engineRef.current) {
              setGuildQuests(engineRef.current.getGuildQuests());
              setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
            }
            return next;
          });
        }}
        onToggleAudio={toggleAudio}
        onToggleControlsGuide={() => setShowControlsGuide((prev) => !prev)}
      />

      {/* Active Guild Bounty Badge */}
      <ActiveQuestWidget
        activeQuest={activeGuildQuest}
        questDefeated={questDefeated}
        isQuestCompleted={isQuestCompleted}
        showQuestCelebration={showQuestCelebration}
        isMobileLandscape={isMobileLandscape}
        onOpenQuestBoard={() => {
          setIsQuestBoardOpen(true);
          if (engineRef.current) {
            setGuildQuests(engineRef.current.getGuildQuests());
            setActiveGuildQuest(engineRef.current.getActiveGuildQuest());
          }
        }}
      />

      {/* Floating Tilt Horizon Level Indicator */}
      <TiltIndicator
        isTiltEnabled={isTiltEnabled}
        isMobileLandscape={isMobileLandscape}
        tiltTextRef={tiltTextRef}
      />

      {/* Floating Controls Guide Card */}
      <ControlsGuideModal
        isOpen={showControlsGuide}
        onClose={() => setShowControlsGuide(false)}
      />

      {/* Controller Section: Adaptive Mobile Landscape vs Desktop Layout */}
      <VirtualGamepad
        isMobileLandscape={isMobileLandscape}
        isTiltEnabled={isTiltEnabled}
        activeKeys={activeKeys}
        handlePointerDown={handlePointerDown}
        handlePointerUp={handlePointerUp}
        handleJump={handleJump}
        handleSpin={handleSpin}
        handleSwordAttack={handleSwordAttack}
        handleReset={handleReset}
        showMiniMap={showMiniMap}
        miniMapExpanded={miniMapExpanded}
      />

      {/* 2D Canvas Radar Mini-Map */}
      <MiniMapRadar
        showMiniMap={showMiniMap}
        miniMapExpanded={miniMapExpanded}
        setMiniMapExpanded={setMiniMapExpanded}
        isMobileLandscape={isMobileLandscape}
        remainingCollectibles={remainingCollectibles}
        engineRef={engineRef}
        playerCoordsRef={playerCoordsRef}
      />

      {/* Floating Loot Notifications */}
      <LootToastContainer
        lootToasts={lootToasts}
        isMobileLandscape={isMobileLandscape}
      />

      {/* Floating Contextual Interact Button [E] */}
      <FloatingInteractButton
        target={nearbyInteractable}
        activeDialogue={activeDialogue}
        isQuestBoardOpen={isQuestBoardOpen}
        isMobileLandscape={isMobileLandscape}
        onInteract={handleTriggerInteraction}
      />

      {/* RPG Dialogue Modal */}
      <DialogueModal
        dialogue={activeDialogue}
        isMobileLandscape={isMobileLandscape}
        onClose={handleCloseDialogue}
        onSelectOption={handleSelectDialogueOption}
      />

      {/* Guild Bounty Board Modal */}
      <BountyBoardModal
        isOpen={isQuestBoardOpen}
        quests={guildQuests}
        isMobileLandscape={isMobileLandscape}
        onClose={handleCloseQuestBoard}
        onAcceptQuest={handleAcceptQuest}
        onClaimReward={handleClaimQuestReward}
      />

      {/* 16-Slot RPG Inventory Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        items={inventoryItems}
        selectedItem={selectedItem}
        activeCategoryFilter={activeCategoryFilter}
        useFeedback={useFeedback}
        isMobileLandscape={isMobileLandscape}
        onClose={() => setIsInventoryOpen(false)}
        onSelectItem={setSelectedItem}
        onFilterChange={setActiveCategoryFilter}
        onUseItem={handleUseItem}
        onEquipWeapon={handleEquipWeapon}
      />

      {/* Cinematic Room Transition Loading Screen */}
      <RoomTransitionModal
        transition={roomTransition}
      />
    </div>
  );
};
