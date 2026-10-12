/**
 * WorldEngine - Three.js Horticultural Simulation Engine Facade
 * Orchestrates WebGL rendering, camera systems, lighting, environment,
 * character kinematics, collectible collision detection, and audio feedback.
 */
import * as THREE from 'three';
import type { CameraMode, InputState, WorldCallbacks, WorldEngineOptions } from '../types';
import { AudioSynth } from '../audio/AudioSynth';
import { TomatoModel } from '../models/TomatoModel';
import { GreenhousePavilion } from '../world/GreenhousePavilion';
import { BotanicalMeadow } from '../world/BotanicalMeadow';
import { CollectiblesManager } from '../world/CollectiblesManager';
import { CharacterController } from '../controller/CharacterController';

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
  private controller: CharacterController;

  // State
  private inputState: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    turbo: false,
    spin: false
  };

  private cameraMode: CameraMode = 'chase';
  private callbacks: WorldCallbacks;
  private currentZoneName: string = '';

  // Orbit camera drag state
  private isPointerDown: boolean = false;
  private pointerPrevX: number = 0;
  private pointerPrevY: number = 0;
  private orbitTheta: number = 0;
  private orbitPhi: number = 0.55;
  private orbitRadius: number = 8.0;

  constructor(options: WorldEngineOptions) {
    this.callbacks = options.callbacks;
    this.cameraMode = options.cameraMode;
    this.clock = new THREE.Clock();

    // 1. Initialize Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Natural Sky Blue
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    // 2. Initialize Camera (spacious view looking forward South through greenhouse doorway)
    this.camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.6, 200);
    this.camera.position.set(0, 3.8, -8.0);
    this.camera.lookAt(new THREE.Vector3(0, 1.0, 0));

    // 3. Initialize Audio
    this.audioSynth = new AudioSynth(options.enableAudio);

    // 4. Initialize Subsystems
    this.greenhouse = new GreenhousePavilion();
    this.meadow = new BotanicalMeadow();
    this.collectibles = new CollectiblesManager();
    this.tomatoModel = new TomatoModel();
    this.controller = new CharacterController();

    this.tomatoModel.setMascotVisible(options.mascotMode);

    // Add to Scene
    this.scene.add(this.meadow.getRoot());
    this.scene.add(this.greenhouse.getRoot());
    this.scene.add(this.collectibles.getRoot());
    this.scene.add(this.tomatoModel.getRoot());

    // 5. Setup Lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    // Hemisphere Light (natural sky sunlight & warm ground reflection)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d702a, 0.95);
    hemiLight.position.set(0, 40, 0);
    this.scene.add(hemiLight);

    // Sun Directional Light with Dynamic Player-Centric Shadow Frustum
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    this.sunLight.position.set(22, 45, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 130;
    const shadowD = 32;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0001;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambientLight);
  }

  public init(container: HTMLElement): void {
    this.container = container;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 620;

    // Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

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
    }
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

  private tick = (): void => {
    this.animationFrameId = requestAnimationFrame(this.tick);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Kinematics Controller
    const isInside = this.greenhouse.isInside(
      this.controller.getPosition().x,
      this.controller.getPosition().z
    );

    // Camera-relative forward & right horizontal vectors for natural intuitive controls
    const camForward = new THREE.Vector3();
    this.camera.getWorldDirection(camForward);
    camForward.y = 0;
    if (camForward.lengthSq() < 0.001) camForward.set(0, 0, 1);
    camForward.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    const { state, justBounced } = this.controller.update(
      deltaTime,
      this.inputState,
      isInside,
      camForward,
      camRight
    );

    if (justBounced) {
      this.audioSynth.play('boing');
      this.callbacks.onBounce?.(this.controller.getBounceCount());
    }

    // 1b. Dynamic Player-Centric Shadow Tracking (Shadows follow player everywhere across 180m)
    this.sunLight.position.set(state.position.x + 32, 45, state.position.z + 22);
    this.sunLight.target.position.copy(state.position);
    this.sunLight.target.updateMatrixWorld();

    // 1c. Dispatch real-time coordinates and heading for HUD Radar Mini-Map
    this.callbacks.onPlayerUpdate?.({ x: state.position.x, z: state.position.z }, state.heading);

    // 2. Dynamic 5-Zone Name Detection Callback
    const zoneName = this.controller.getZoneName(isInside);
    if (zoneName !== this.currentZoneName) {
      this.currentZoneName = zoneName;
      this.callbacks.onZoneChange?.(zoneName);
    }

    // 3. Speed Gauge Callback (Percentage of max speed)
    const horizSpeed = Math.hypot(state.velocity.x, state.velocity.z);
    const speedPct = Math.min(100, Math.round((horizSpeed / 24.0) * 100));
    this.callbacks.onSpeedChange?.(speedPct);

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
      this.callbacks.onScoreChange?.(this.controller.getScore());
    }

    // 6. Update Meadow Living Ecosystem (Windmill, butterflies, clouds, spores)
    this.meadow.update(deltaTime, elapsedTime);

    // 7. Update Camera Posture with adaptive distance
    this.updateCamera(state.position, state.heading, isInside);

    // 8. Render Frame
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private updateCamera(targetPos: THREE.Vector3, targetHeading: number, isInside: boolean): void {
    if (this.cameraMode === 'chase') {
      // Adaptive Chase Camera (6.4m in greenhouse, 8.6m in wide open world)
      const camDist = isInside ? 6.4 : 8.6;
      const camHeight = isInside ? 3.0 : 3.8;
      const behindX = targetPos.x - Math.sin(targetHeading) * camDist;
      const behindZ = targetPos.z - Math.cos(targetHeading) * camDist;

      // Lerp camera for cinematic smoothness
      this.camera.position.x += (behindX - this.camera.position.x) * 0.08;
      this.camera.position.y += (targetPos.y + camHeight - this.camera.position.y) * 0.08;
      this.camera.position.z += (behindZ - this.camera.position.z) * 0.08;

      const lookTarget = targetPos.clone().add(new THREE.Vector3(0, 0.85, 0));
      this.camera.lookAt(lookTarget);
    } else {
      // Orbit Camera centered on tomato
      const cx = targetPos.x + this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const cy = targetPos.y + this.orbitRadius * Math.cos(this.orbitPhi);
      const cz = targetPos.z + this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 0.8, 0)));
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
    this.collectibles.dispose();
    this.tomatoModel.dispose();
  }
}
