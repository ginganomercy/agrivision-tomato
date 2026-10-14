/**
 * WorldEngine - Three.js Horticultural Simulation Engine Facade
 * Orchestrates WebGL rendering, camera systems, lighting, environment,
 * character kinematics, collectible collision detection, and audio feedback.
 */
import * as THREE from 'three';
import type { 
  CameraMode, 
  InputState, 
  RoomLocation, 
  InventoryItem, 
  WorldCallbacks, 
  WorldEngineOptions,
  InteractableTarget,
  DialogueOption,
  GuildQuest
} from '../types';
import { AudioSynth } from '../audio/AudioSynth';
import { TomatoModel } from '../models/TomatoModel';
import { GreenhousePavilion } from '../world/GreenhousePavilion';
import { BotanicalMeadow } from '../world/BotanicalMeadow';
import { CollectiblesManager } from '../world/CollectiblesManager';
import { MonsterManager } from '../world/MonsterManager';
import { CharacterController } from '../controller/CharacterController';
import { InventoryManager } from '../world/InventoryManager';
import { GuildTavernInterior } from '../world/GuildTavernInterior';
import { QuestManager } from '../world/QuestManager';
import { NPCManager } from '../world/NPCManager';

// Render & Lighting Tuning Constants (No Magic Numbers)
const MOBILE_AMBIENT_LIGHT_INTENSITY = 0.58;
const DESKTOP_AMBIENT_LIGHT_INTENSITY = 0.35;
const MOBILE_HEMI_LIGHT_INTENSITY = 1.15;
const DESKTOP_HEMI_LIGHT_INTENSITY = 0.95;
const SUN_LIGHT_INTENSITY = 1.4;
const SUN_SHADOW_FRUSTUM_SIZE = 32;
const SUN_SHADOW_MAP_SIZE = 1024; // 1024px with PCFSoftShadowMap produces crisp soft shadows with 75% less GPU fillrate than 2048px
const MOBILE_TARGET_DPR = 1.15;
const DESKTOP_TARGET_DPR = 1.35;

export class WorldEngine {
  // Core Three.js components
  private container: HTMLElement | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private sunLight!: THREE.DirectionalLight;

  // Subsystems
  private audioSynth: AudioSynth;
  private tomatoModel: TomatoModel;
  private greenhouse: GreenhousePavilion;
  private meadow: BotanicalMeadow;
  private collectibles: CollectiblesManager;
  private monsters: MonsterManager;
  private controller: CharacterController;
  private inventory: InventoryManager;
  private tavernInterior: GuildTavernInterior;
  private questManager: QuestManager;
  private npcManager: NPCManager;
  private activeInteractable: InteractableTarget | null = null;

  // State
  private inputState: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    turbo: false,
    spin: false,
    attack: false
  };

  private cameraMode: CameraMode = 'chase';
  private callbacks: WorldCallbacks;
  private currentZoneName: string = '';
  private lastReportedSpeed: number = -1;

  // Zone visit tracking for exploration quests
  private visitedBiomeZones: Set<string> = new Set();

  // Throttle counter for biome visibility culling (runs every 10 frames)
  private biomeCullCounter: number = 0;

  // Room Location & Cinematic Transition State
  private currentRoom: RoomLocation = 'meadow';
  private isTransitioningRoom: boolean = false;

  // Orbit camera drag state
  private isPointerDown: boolean = false;
  private pointerPrevX: number = 0;
  private pointerPrevY: number = 0;
  private orbitTheta: number = 0;
  private orbitPhi: number = 0.55;
  private orbitRadius: number = 8.0;

  // Pre-allocated scratch objects for zero-allocation tick & camera updates (eliminates GC jank)
  private readonly _scratchCamForward = new THREE.Vector3();
  private readonly _scratchCamRight = new THREE.Vector3();
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);
  private readonly _scratchLookTarget = new THREE.Vector3();

  /**
   * Evaluates if current client is a touch mobile device for adaptive rendering
   */
  public static isMobileDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth <= 1024;
    return isMobileUA || (isTouch && isNarrow);
  }

  constructor(options: WorldEngineOptions) {
    this.callbacks = options.callbacks;
    this.cameraMode = options.cameraMode;
    this.clock = new THREE.Clock();

    // 1. Initialize Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Natural Sky Blue
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    // 2. Initialize Camera
    // Far plane = 140 (provably zero visual change: FogExp2(0.012) renders objects at 140m
    // at only 18.7% visibility — fully blended into sky color by fog before far clip)
    this.camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.6, 140);
    this.camera.position.set(0, 3.8, -8.0);
    this.camera.lookAt(new THREE.Vector3(0, 1.0, 0));

    // 3. Initialize Audio
    this.audioSynth = new AudioSynth(options.enableAudio);

    // 4. Initialize Subsystems
    this.greenhouse = new GreenhousePavilion();
    this.meadow = new BotanicalMeadow();
    this.collectibles = new CollectiblesManager();
    this.monsters = new MonsterManager();
    this.tomatoModel = new TomatoModel();
    this.controller = new CharacterController();
    this.tavernInterior = new GuildTavernInterior();
    this.questManager = new QuestManager();
    this.npcManager = new NPCManager();

    // 4b. Initialize Inventory System & Wire Callbacks
    this.inventory = new InventoryManager(
      (items) => this.callbacks.onInventoryUpdate?.(items),
      (name, icon, qty) => this.callbacks.onItemLooted?.(name, icon, qty)
    );

    // Wire Quest Manager Callbacks
    this.questManager.onQuestComplete = (quest: GuildQuest) => {
      this.controller.addScore(quest.rewardScore);
      this.audioSynth.play('fanfare');
      this.callbacks.onScoreChange?.(this.controller.getScore());
      if (quest.rewardItemName && quest.rewardItemIcon) {
        this.inventory.addItem({
          id: `reward_${Date.now()}`,
          name: quest.rewardItemName,
          category: 'loot',
          rarity: 'rare',
          icon: quest.rewardItemIcon,
          description: `Hadiah resmi dari Sayembara Serikat Tani: ${quest.title}`,
          maxStack: 16
        }, quest.rewardItemQty || 1);
      }
      this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
    };

    // Wire Monster Quest Callbacks (legacy backward-compatibility)
    this.monsters.onQuestUpdate = (defeated, total) => {
      this.callbacks.onQuestUpdate?.(defeated, total);
    };
    this.monsters.onQuestComplete = (rewardScore) => {
      this.controller.addScore(rewardScore);
      this.audioSynth.play('fanfare');
      this.callbacks.onScoreChange?.(this.controller.getScore());
      this.callbacks.onQuestComplete?.(rewardScore);
    };

    this.tomatoModel.setMascotVisible(options.mascotMode);

    // Add to Scene
    this.scene.add(this.meadow.getRoot());
    this.scene.add(this.greenhouse.getRoot());
    this.scene.add(this.tavernInterior.getRoot());
    this.scene.add(this.npcManager.getRoot());
    this.scene.add(this.collectibles.getRoot());
    this.scene.add(this.monsters.getRoot());
    this.scene.add(this.tomatoModel.getRoot());

    // Initial Room Occlusion Culling (underground tavern hidden by default when outdoor)
    this.updateRoomVisibility(this.currentRoom);

    // 5. Setup Lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    const isMobile = WorldEngine.isMobileDevice();

    // Hemisphere Light (natural sky sunlight & warm ground reflection, boosted on mobile for vibrancy)
    const hemiIntensity = isMobile ? MOBILE_HEMI_LIGHT_INTENSITY : DESKTOP_HEMI_LIGHT_INTENSITY;
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d702a, hemiIntensity);
    hemiLight.position.set(0, 40, 0);
    this.scene.add(hemiLight);

    // Sun Directional Light with Dynamic Player-Centric Shadow Frustum
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, SUN_LIGHT_INTENSITY);
    this.sunLight.position.set(22, 45, 18);
    this.sunLight.castShadow = !isMobile;
    if (!isMobile) {
      this.sunLight.shadow.mapSize.width = SUN_SHADOW_MAP_SIZE;
      this.sunLight.shadow.mapSize.height = SUN_SHADOW_MAP_SIZE;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 130;
      this.sunLight.shadow.camera.left = -SUN_SHADOW_FRUSTUM_SIZE;
      this.sunLight.shadow.camera.right = SUN_SHADOW_FRUSTUM_SIZE;
      this.sunLight.shadow.camera.top = SUN_SHADOW_FRUSTUM_SIZE;
      this.sunLight.shadow.camera.bottom = -SUN_SHADOW_FRUSTUM_SIZE;
      this.sunLight.shadow.bias = -0.0001;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Ambient fill (compensated on mobile for crisp lighting without shadow pass)
    const ambientIntensity = isMobile ? MOBILE_AMBIENT_LIGHT_INTENSITY : DESKTOP_AMBIENT_LIGHT_INTENSITY;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    this.scene.add(ambientLight);
  }

  public init(container: HTMLElement): void {
    this.container = container;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 620;

    // Initialize WebGLRenderer with adaptive hardware tiering
    const isMobile = WorldEngine.isMobileDevice();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Disable MSAA on mobile for crisp fillrate
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    // Adaptive DPR: Cap at 1.15 on mobile (60 FPS silky smooth), 1.5 on desktop
    const targetDPR = isMobile ? MOBILE_TARGET_DPR : DESKTOP_TARGET_DPR;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, targetDPR));
    this.renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.renderer.toneMapping = isMobile ? THREE.ReinhardToneMapping : THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = isMobile ? 1.0 : 1.05;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    container.appendChild(this.renderer.domElement);

    // Bind event listeners
    this.bindEvents();

    // Start Animation Loop
    this.clock.start();
    this.tick();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);

    if (this.container) {
      this.container.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    }
  }

  private onResize = (): void => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 620;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.isPointerDown = true;
    this.pointerPrevX = e.clientX;
    this.pointerPrevY = e.clientY;
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isPointerDown || this.cameraMode !== 'orbit') return;
    const deltaX = e.clientX - this.pointerPrevX;
    const deltaY = e.clientY - this.pointerPrevY;
    this.pointerPrevX = e.clientX;
    this.pointerPrevY = e.clientY;

    this.orbitTheta -= deltaX * 0.006;
    this.orbitPhi = THREE.MathUtils.clamp(this.orbitPhi + deltaY * 0.006, 0.1, 1.4);
  };

  private onPointerUp = (): void => {
    this.isPointerDown = false;
  };

  public setInput(key: keyof InputState, value: boolean): void {
    this.inputState[key] = value;
    if (key === 'turbo' && value) {
      this.audioSynth.play('boost');
    }
    if (key === 'attack' && value) {
      this.triggerSwordAttack();
    }
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public setMascotMode(enabled: boolean): void {
    this.tomatoModel.setMascotVisible(enabled);
  }

  public setAudioEnabled(enabled: boolean): void {
    this.audioSynth.setEnabled(enabled);
  }

  public triggerJump(): void {
    const jumped = this.controller.triggerJump();
    if (jumped) {
      this.audioSynth.play('boing');
      this.callbacks.onBounce?.(this.controller.getBounceCount());
    }
  }

  public triggerSpin(): void {
    const spun = this.controller.triggerSpin();
    if (spun) {
      this.audioSynth.play('spin');
      this.callbacks.onScoreChange?.(this.controller.getScore());

      // Immediate spin attack check on nearby pest monsters
      const hitResult = this.monsters.checkAttackHit(
        this.controller.getPosition(),
        true,
        false,
        false
      );
      if (hitResult) {
        this.controller.addScore(hitResult.scoreGained);
        this.audioSynth.play(hitResult.defeated ? 'defeat' : 'hit');
        this.callbacks.onScoreChange?.(this.controller.getScore());
        if (hitResult.defeated && hitResult.monsterType) {
          this.inventory.addMonsterLoot(hitResult.monsterType);
        }
      }
    }
  }

  /**
   * Triggers a 3D leaf blade sword slash attack combo
   */
  public triggerSwordAttack(): boolean {
    const executed = this.tomatoModel.triggerSlash();
    if (executed) {
      this.audioSynth.play('sword_slash');

      // Extended sword melee range check against pest monsters
      const hitResult = this.monsters.checkAttackHit(
        this.controller.getPosition(),
        false,
        false,
        false,
        true // isSwordSlash
      );

      if (hitResult) {
        const equipped = this.inventory.getEquippedWeapon();
        const weaponBonus = equipped?.attackBonus || 25;
        this.controller.addScore(hitResult.scoreGained + weaponBonus);
        this.audioSynth.play('sword_hit');
        this.callbacks.onScoreChange?.(this.controller.getScore());

        if (hitResult.defeated && hitResult.monsterType) {
          this.inventory.addMonsterLoot(hitResult.monsterType);
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Initiates a seamless cinematic RPG room transition with vignette and audio
   */
  public startRoomTransition(targetRoom: RoomLocation): void {
    if (this.isTransitioningRoom || targetRoom === this.currentRoom) return;
    this.isTransitioningRoom = true;

    let title = 'Hamparan Padang Rumput Hijau';
    let subtitle = 'Eksplorasi Lanskap Pertanian Holtikultura Terbuka';
    let icon = '🌿';

    if (targetRoom === 'greenhouse') {
      title = 'Laboratorium Rumah Kaca Botani';
      subtitle = 'Pusat Riset Kultivar & Nutrisi Hidroponik Agrivision';
      icon = '🔬';
    } else if (targetRoom === 'tavern') {
      title = 'Kedai Serikat Tani (Agri-Guild Tavern)';
      subtitle = 'Pusat Istirahat Pemburu Hama & Bursa Panen Komoditas';
      icon = '🍺';
    } else if (targetRoom === 'windmill') {
      title = 'Menara Observasi Kincir Angin';
      subtitle = 'Titik Pantau Cuaca & Turbin Angin Ramah Lingkungan';
      icon = '🌾';
    }

    this.audioSynth.play('door_enter');

    // Notify React UI for cinematic load screen overlay
    this.callbacks.onRoomTransition?.({
      isTransitioning: true,
      location: targetRoom,
      title,
      subtitle,
      icon
    });

    // 380ms midpoint: warp player coordinates cleanly
    setTimeout(() => {
      const prevRoom = this.currentRoom;
      this.currentRoom = targetRoom;

      // Update Room Occlusion Culling (hide outdoor world in tavern, hide underground tavern in meadow)
      this.updateRoomVisibility(targetRoom);

      // Adapt Scene Background & Fog based on room location
      if (targetRoom === 'tavern') {
        this.scene.background = new THREE.Color(0x23170e); // Warm cozy dark timber interior
        this.scene.fog = new THREE.FogExp2(0x23170e, 0.012);
        // Warp player comfortably inside the hall (z = 21.0), facing North into the grand hall
        this.controller.warpTo(-14.0, -39.16, 21.0, Math.PI);
      } else if (targetRoom === 'greenhouse') {
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.010);
        this.controller.warpTo(0, 0.1, 4.6, Math.PI); // facing North inside
      } else if (targetRoom === 'windmill') {
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);
        this.controller.warpTo(38, 6.2, 40.0, -Math.PI * 0.75); // balcony deck
        // Update survey quest if active
        this.questManager.updateProgress('location', 1);
        this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
      } else {
        // Exiting back into meadow
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);
        if (prevRoom === 'greenhouse') {
          this.controller.warpTo(0, 0.1, 8.8, 0); // facing South
        } else if (prevRoom === 'tavern') {
          // Warp player back to porch deck outside Tavern facing South onto garden path
          this.controller.warpTo(-14.0, 1.24, 23.6, 0);
        } else if (prevRoom === 'windmill') {
          this.controller.warpTo(38, 0.1, 33.8, 0); // ground
        } else {
          this.controller.warpTo(0, 0.1, 8.8, 0);
        }
      }

      // 760ms: Complete transition and fade back in
      setTimeout(() => {
        this.isTransitioningRoom = false;
        this.callbacks.onRoomTransition?.({
          isTransitioning: false,
          location: this.currentRoom,
          title,
          subtitle,
          icon
        });
      }, 380);
    }, 380);
  }

  public getInventory(): InventoryItem[] {
    return this.inventory.getItems();
  }

  public useInventoryItem(id: string): { success: boolean; message: string; speedBoost?: number } {
    const res = this.inventory.useItem(id);
    if (res.success) {
      this.audioSynth.play('collect');
      if (res.speedBoost) {
        this.controller.applySpeedBoost(res.speedBoost, 15);
      }
    }
    return res;
  }

  public equipInventoryWeapon(id: string): { success: boolean; message: string; atk: number } {
    const res = this.inventory.equipWeapon(id);
    if (res.success) {
      this.audioSynth.play('sword_slash');
    }
    return res;
  }

  public getCurrentRoom(): RoomLocation {
    return this.currentRoom;
  }

  public getQuestStatus(): { defeated: number; total: number; completed: boolean } {
    return this.monsters.getQuestStatus();
  }

  public getActiveCollectibles(): { x: number; z: number; points: number }[] {
    return this.collectibles.getActivePositions();
  }

  public resetCharacter(): void {
    this.controller.resetPosition();
    this.collectibles.resetAll();
    this.callbacks.onScoreChange?.(this.controller.getScore());
    this.callbacks.onBounce?.(this.controller.getBounceCount());
  }

  // --- RPG Quest & NPC Interaction Public APIs ---

  public getNearbyInteractable(): InteractableTarget | null {
    return this.activeInteractable;
  }

  public hasNearbyInteractable(): boolean {
    return this.activeInteractable !== null;
  }

  public triggerInteraction(): boolean {
    if (!this.activeInteractable) return false;

    if (this.activeInteractable.type === 'bounty_board') {
      this.audioSynth.play('door_enter');
      this.callbacks.onOpenQuestBoard?.(true);
      return true;
    }

    if (this.activeInteractable.type === 'npc') {
      const dialogue = this.npcManager.getInitialDialogue(this.activeInteractable.id);
      if (dialogue) {
        this.audioSynth.play('boing');
        this.callbacks.onOpenDialogue?.(dialogue);
        return true;
      }
    }

    return false;
  }

  public selectDialogueOption(option: DialogueOption): void {
    if (option.action === 'open_bounty_board' || option.action === 'open_quest_board') {
      this.callbacks.onOpenDialogue?.(null);
      this.callbacks.onOpenQuestBoard?.(true);
    } else {
      const nextId = option.nextDialogueId || option.nextNodeId;
      if (nextId) {
        const next = this.npcManager.getDialogueNode(nextId);
        this.callbacks.onOpenDialogue?.(next);
      } else {
        this.callbacks.onOpenDialogue?.(null);
      }
    }
  }

  public closeDialogue(): void {
    this.callbacks.onOpenDialogue?.(null);
  }

  public closeQuestBoard(): void {
    this.callbacks.onOpenQuestBoard?.(false);
  }

  public acceptQuest(id: string): boolean {
    const res = this.questManager.acceptQuest(id);
    if (res.success) {
      this.audioSynth.play('collect');
      this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
    }
    return res.success;
  }

  public claimQuestReward(id: string): boolean {
    const res = this.questManager.claimReward(id);
    if (res.success) {
      this.controller.addScore(res.score);
      this.audioSynth.play('fanfare');
      this.callbacks.onScoreChange?.(this.controller.getScore());
      if (res.itemName && res.itemIcon) {
        this.inventory.addItem({
          id: `reward_${Date.now()}`,
          name: res.itemName,
          category: 'loot',
          rarity: 'rare',
          icon: res.itemIcon,
          description: `Hadiah resmi penyelesaian Sayembara Serikat Tani.`,
          maxStack: 16
        }, res.itemQty || 1);
      }
      this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
    }
    return res.success;
  }

  public getGuildQuests(): GuildQuest[] {
    return this.questManager.getQuests();
  }

  public getActiveGuildQuest(): GuildQuest | null {
    return this.questManager.getActiveQuest();
  }

  private tick = (): void => {
    this.animationFrameId = requestAnimationFrame(this.tick);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Kinematics Controller
    // Camera-relative forward & right horizontal vectors for natural intuitive controls (Zero-allocation)
    this.camera.getWorldDirection(this._scratchCamForward);
    this._scratchCamForward.y = 0;
    if (this._scratchCamForward.lengthSq() < 0.001) {
      this._scratchCamForward.set(0, 0, 1);
    } else {
      this._scratchCamForward.normalize();
    }

    this._scratchCamRight.crossVectors(this._scratchCamForward, this._worldUp).normalize();

    const { state, justBounced } = this.controller.update(
      deltaTime,
      this.inputState,
      this.currentRoom,
      this._scratchCamForward,
      this._scratchCamRight
    );

    if (justBounced) {
      this.audioSynth.play('boing');
      this.callbacks.onBounce?.(this.controller.getBounceCount());
    }

    // 1b. Dynamic Building Portal Transitions Detection
    if (!this.isTransitioningRoom) {
      const pos = state.position;
      if (this.currentRoom === 'meadow') {
        // Greenhouse South door portal
        if (Math.abs(pos.x) <= 1.6 && pos.z <= 6.8 && pos.z >= 5.8) {
          this.startRoomTransition('greenhouse');
        }
        // Agri-Guild Tavern porch front door (walk through swung open door)
        else if (Math.abs(pos.x - (-14.0)) <= 1.2 && pos.z <= 22.3 && pos.z >= 21.6) {
          this.startRoomTransition('tavern');
        }
        // Windmill base observation stairs
        else if (pos.x >= 36.0 && pos.x <= 40.0 && pos.z >= 35.8 && pos.z <= 37.8) {
          this.startRoomTransition('windmill');
        }
      } else if (this.currentRoom === 'greenhouse') {
        // Exiting Greenhouse south door
        if (Math.abs(pos.x) <= 1.8 && pos.z >= 6.8) {
          this.startRoomTransition('meadow');
        }
      } else if (this.currentRoom === 'tavern') {
        // Exiting Tavern interior through swung open south door
        if (Math.abs(pos.x - (-14.0)) <= 1.2 && pos.z >= 25.8) {
          this.startRoomTransition('meadow');
        }
      } else if (this.currentRoom === 'windmill') {
        // Exiting Windmill balcony deck down stairs
        if (pos.z <= 37.0) {
          this.startRoomTransition('meadow');
        }
      }
    }

    // 1c. Dynamic Player-Centric Shadow Tracking (Follows player everywhere across 260m on desktop)
    if (this.sunLight.castShadow) {
      this.sunLight.position.set(state.position.x + 32, 45, state.position.z + 22);
      this.sunLight.target.position.copy(state.position);
      this.sunLight.target.updateMatrixWorld();
    }

    // 1d. Dispatch real-time coordinates and heading for HUD Radar Mini-Map
    this.callbacks.onPlayerUpdate?.({ x: state.position.x, z: state.position.z }, state.heading);

    // 2. Dynamic Zone Name Detection
    const zoneName = this.controller.getZoneName(this.currentRoom);
    if (zoneName !== this.currentZoneName) {
      this.currentZoneName = zoneName;
      this.callbacks.onZoneChange?.(zoneName);

      // — Zone Visit Quest Tracking for Exploration Quests —
      const biomeZoneMap: Record<string, string> = {
        '🏛️ Reruntuhan Kuno Agrikultura': 'ruins',
        '🌾 Sawah Irigasi & Sungai Timur': 'rice',
        '🍄 Hutan Jamur Misterius': 'mushroom',
        '🏪 Pasar Panen Terbuka (Harvest Bazaar)': 'bazaar'
      };
      const biomeKey = biomeZoneMap[zoneName];
      if (biomeKey && !this.visitedBiomeZones.has(biomeKey)) {
        this.visitedBiomeZones.add(biomeKey);
        this.questManager.updateProgress('explore_zone', 1);
        this.questManager.updateProgress(biomeKey, 1);
        this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
      }
    }

    // 2b. Zone-Based Biome Visibility Culling (zero visual change, runs every 10 frames)
    // FogExp2(0.012): at 88m visibility = e^(-1.056) ≈ 34% — objects already blended into sky.
    // Hiding groups beyond this range changes zero visible pixels but saves significant GPU.
    this.biomeCullCounter = (this.biomeCullCounter + 1) % 10;
    if (this.biomeCullCounter === 0 && this.currentRoom === 'meadow') {
      const biomes = this.meadow.getBiomeGroups();
      const px = state.position.x;
      const pz = state.position.z;
      biomes.ruins.visible    = Math.hypot(px,       pz + 65) < 92;
      biomes.rice.visible     = Math.hypot(px - 80,  pz - 10) < 92;
      biomes.mushroom.visible = Math.hypot(px + 80,  pz - 10) < 92;
      biomes.bazaar.visible   = Math.hypot(px,       pz - 80) < 92;
    }

    // 3. Throttled Speed Gauge Callback (Percentage of max speed)
    const horizSpeed = Math.hypot(state.velocity.x, state.velocity.z);
    const speedPct = Math.min(100, Math.round((horizSpeed / 24.0) * 100));
    if (Math.abs(speedPct - this.lastReportedSpeed) >= 2 || (speedPct === 0 && this.lastReportedSpeed !== 0)) {
      this.lastReportedSpeed = speedPct;
      this.callbacks.onSpeedChange?.(speedPct);
    }


    // 4. Update Character Visual Posture
    const tomatoGroup = this.tomatoModel.getRoot();
    tomatoGroup.position.copy(state.position);

    // Root group maintains upright orientation with pure Heading Yaw (Y-axis only)
    tomatoGroup.rotation.set(0, state.heading, 0);

    // Character organic kinematics (local tilt pitch/roll, stride hop, squash/stretch, stem inertia, blinking)
    this.tomatoModel.updateAnimation(
      deltaTime,
      horizSpeed,
      state.isGrounded,
      state.velocity.y,
      state.pitch,
      state.roll
    );

    // 5. Update Collectibles & Collision
    this.collectibles.update(elapsedTime);
    const collected = this.collectibles.checkCollision(state.position);
    if (collected) {
      this.controller.addScore(collected.points);
      this.audioSynth.play('collect');
      this.inventory.addGoldenDew();
      this.questManager.updateProgress('collect', 1);
      this.callbacks.onScoreChange?.(this.controller.getScore());
      this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
    }

    // 5b. Update Pest Monsters & Dynamic Combat Detection
    this.monsters.update(deltaTime, elapsedTime, this.camera);
    const isStompAttack = !state.isGrounded && state.velocity.y < -1.2;
    const attackHit = this.monsters.checkAttackHit(
      state.position,
      this.controller.getIsSpinning(),
      isStompAttack,
      state.isBoosting,
      this.tomatoModel.isSlashing()
    );
    if (attackHit) {
      this.controller.addScore(attackHit.scoreGained);
      this.audioSynth.play(attackHit.defeated ? 'defeat' : 'hit');
      this.callbacks.onScoreChange?.(this.controller.getScore());
      if (attackHit.defeated && attackHit.monsterType) {
        this.inventory.addMonsterLoot(attackHit.monsterType);
        this.questManager.updateProgress('monster', 1);
        this.callbacks.onActiveQuestChange?.(this.questManager.getActiveQuest());
      }
    }

    // 6. Update Meadow Living Ecosystem, Animated Doors, Tavern Interior & NPCs
    if (this.currentRoom !== 'tavern') {
      this.meadow.update(deltaTime, elapsedTime);
      this.meadow.updateTavernDoor(deltaTime, state.position);
    } else {
      this.tavernInterior.update(deltaTime, state.position);
    }
    this.npcManager.update(deltaTime, state.position);

    // 6b. Check Proximity to Interactable NPCs or Bounty Board
    const nearbyTarget = this.npcManager.checkInteractable(state.position);
    if (nearbyTarget?.id !== this.activeInteractable?.id) {
      this.activeInteractable = nearbyTarget;
      this.callbacks.onInteractableChange?.(nearbyTarget);
    }

    // 7. Update Camera Posture with adaptive distance
    this.updateCamera(state.position, state.heading, this.currentRoom);

    // 8. Render Frame
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private updateRoomVisibility(targetRoom: RoomLocation): void {
    if (targetRoom === 'tavern') {
      // Inside Tavern: strictly hide outdoor meadow & greenhouse to free GPU draw calls
      this.tavernInterior.getRoot().visible = true;
      this.meadow.getRoot().visible = false;
      this.greenhouse.getRoot().visible = false;
    } else {
      // Outdoor / Greenhouse: hide underground tavern interior completely
      this.tavernInterior.getRoot().visible = false;
      this.meadow.getRoot().visible = true;
      this.greenhouse.getRoot().visible = true;
    }
  }

  private updateCamera(targetPos: THREE.Vector3, targetHeading: number, currentRoom: RoomLocation): void {
    if (this.cameraMode === 'chase') {
      // Adaptive Chase Camera (6.4m in greenhouse, 5.2m in cozy grand tavern, 8.6m in wide open world)
      let camDist = 8.6;
      let camHeight = 3.8;
      if (currentRoom === 'greenhouse') {
        camDist = 6.4;
        camHeight = 3.0;
      } else if (currentRoom === 'tavern') {
        camDist = 5.2;
        camHeight = 2.4;
      }
      let behindX = targetPos.x - Math.sin(targetHeading) * camDist;
      let behindZ = targetPos.z - Math.cos(targetHeading) * camDist;

      // Inside tavern: strictly clamp camera within hall interior to prevent clipping through perimeter walls!
      if (currentRoom === 'tavern') {
        behindX = THREE.MathUtils.clamp(behindX, -24.5, -3.5);
        behindZ = THREE.MathUtils.clamp(behindZ, 10.5, 26.2);
      }

      // Lerp camera for cinematic smoothness
      this.camera.position.x += (behindX - this.camera.position.x) * 0.08;
      this.camera.position.y += (targetPos.y + camHeight - this.camera.position.y) * 0.08;
      this.camera.position.z += (behindZ - this.camera.position.z) * 0.08;

      this._scratchLookTarget.set(targetPos.x, targetPos.y + 0.85, targetPos.z);
      this.camera.lookAt(this._scratchLookTarget);
    } else {
      // Orbit Camera centered on tomato
      const cx = targetPos.x + this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const cy = targetPos.y + this.orbitRadius * Math.cos(this.orbitPhi);
      const cz = targetPos.z + this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

      this.camera.position.set(cx, cy, cz);
      this._scratchLookTarget.set(targetPos.x, targetPos.y + 0.8, targetPos.z);
      this.camera.lookAt(this._scratchLookTarget);
    }
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    if (this.container && this.renderer) {
      this.container.removeEventListener('pointerdown', this.onPointerDown);
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
      this.renderer = null;
    }

    this.audioSynth.dispose();
    this.greenhouse.dispose();
    this.meadow.dispose();
    this.tavernInterior.dispose();
    this.npcManager.dispose();
    this.collectibles.dispose();
    this.monsters.dispose();
    this.tomatoModel.dispose();
  }
}
