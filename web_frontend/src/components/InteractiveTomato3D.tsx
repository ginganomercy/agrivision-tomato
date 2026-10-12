import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Sparkles, 
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
  HelpCircle
} from 'lucide-react';

interface InteractiveTomato3DProps {
  onInteract?: (action: string) => void;
}

interface CollectibleOrb {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  x: number;
  z: number;
  active: boolean;
  baseY: number;
}

export const InteractiveTomato3D: React.FC<InteractiveTomato3DProps> = ({ onInteract }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Game state
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});
  const [speedGauge, setSpeedGauge] = useState<number>(0);
  const [bounces, setBounces] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [mascotMode, setMascotMode] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase'>('orbit');
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [currentExpression, setCurrentExpression] = useState<'normal' | 'jump' | 'boost'>('normal');

  // Web Audio Context synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!isAudioEnabled) return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, [isAudioEnabled]);

  // Procedural Sound Effects via Web Audio Synthesizer
  const playSoundEffect = useCallback((type: 'boing' | 'collect' | 'boost' | 'spin') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'boing') {
        // Play rubbery bounce synth
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (type === 'collect') {
        // Ascending harmonic chime
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.05);
          g.gain.setValueAtTime(0.12, now + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + idx * 0.05);
          o.stop(now + idx * 0.05 + 0.23);
        });
      } else if (type === 'boost') {
        // High-tech whoosh sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
        gain.gain.setValueAtTime(0.10, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'spin') {
        // Whimsical spin flutter
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.31);
      }
    } catch {
      // Audio autoplay policy catch
    }
  }, [getAudioContext]);

  // Physics Simulation State
  const physicsRef = useRef({
    pos: new THREE.Vector3(0, 0, 0),
    vel: new THREE.Vector3(0, 0, 0),
    isJumping: false,
    jumpVelocity: 0,
    squashFactor: 1.0,
    spinAngle: 0,
    isSpinning: false,
    spinVelocity: 0,
    keys: { w: false, a: false, s: false, d: false, space: false, shift: false, q: false, e: false }
  });

  const resetPosition = useCallback(() => {
    const p = physicsRef.current;
    p.pos.set(0, 0, 0);
    p.vel.set(0, 0, 0);
    p.isJumping = false;
    p.jumpVelocity = 0;
    p.squashFactor = 1.0;
    p.spinAngle = 0;
    p.isSpinning = false;
    setCurrentExpression('normal');
  }, []);

  // Handle on-screen buttons
  const triggerKeyAction = (key: 'w' | 'a' | 's' | 'd' | 'space' | 'shift' | 'spin', isDown: boolean) => {
    const p = physicsRef.current;
    if (key === 'spin' && isDown && !p.isSpinning) {
      p.isSpinning = true;
      p.spinVelocity = 14.0;
      playSoundEffect('spin');
      if (onInteract) onInteract('SPIN');
      return;
    }

    if (key === 'space' && isDown && !p.isJumping) {
      p.isJumping = true;
      p.jumpVelocity = 0.27;
      setBounces(b => b + 1);
      setCurrentExpression('jump');
      playSoundEffect('boing');
      if (onInteract) onInteract('JUMP');
    }

    if (key === 'shift') {
      p.keys.shift = isDown;
      if (isDown) {
        playSoundEffect('boost');
        setCurrentExpression('boost');
      } else {
        setCurrentExpression('normal');
      }
    } else if (key !== 'spin' && key !== 'space') {
      p.keys[key] = isDown;
    }

    setActiveKeys({ ...p.keys });
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.028);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5.0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // 2. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.95);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.SpotLight(0xFFFFFF, 4.2, 35, Math.PI / 3.2, 0.3, 1);
    mainKeyLight.position.set(5, 12, 7);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.set(1024, 1024);
    mainKeyLight.shadow.bias = -0.001;
    scene.add(mainKeyLight);

    const crimsonRimLight = new THREE.DirectionalLight(0xF43F5E, 3.2);
    crimsonRimLight.position.set(-8, 4, -6);
    scene.add(crimsonRimLight);

    const emeraldAccentLight = new THREE.DirectionalLight(0x10B981, 2.0);
    emeraldAccentLight.position.set(7, 3, -7);
    scene.add(emeraldAccentLight);

    const underGlow = new THREE.PointLight(0x38BDF8, 1.8, 12);
    underGlow.position.set(0, -0.2, 0);
    scene.add(underGlow);

    // 3. Hologram Cyber Arena Platform
    const ARENA_RADIUS = 7.5;
    const floorGeo = new THREE.CircleGeometry(ARENA_RADIUS, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090D18,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.94
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Arena Perimeter Neon Ring
    const perimeterRingGeo = new THREE.RingGeometry(ARENA_RADIUS - 0.15, ARENA_RADIUS, 64);
    const perimeterRingMat = new THREE.MeshBasicMaterial({ color: 0xF43F5E, side: THREE.DoubleSide });
    const perimeterRing = new THREE.Mesh(perimeterRingGeo, perimeterRingMat);
    perimeterRing.rotation.x = -Math.PI / 2;
    perimeterRing.position.y = 0.012;
    scene.add(perimeterRing);

    // Inner Concentric Pulse Ring
    const pulseRingGeo = new THREE.RingGeometry(3.8, 3.9, 64);
    const pulseRingMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 0.014;
    scene.add(pulseRing);

    // Hexagonal Grid Arena
    const gridHelper = new THREE.GridHelper(ARENA_RADIUS * 2, 28, 0xF43F5E, 0x1E293B);
    gridHelper.position.y = 0.015;
    scene.add(gridHelper);

    // 4. Procedural 3D Tomato Root Group
    const tomatoRoot = new THREE.Group();
    scene.add(tomatoRoot);

    const TOMATO_RADIUS = 0.95;

    // Organic Tomato Flesh (Sinusoidal 6-Lobed Deformed Sphere)
    const sphereGeo = new THREE.SphereGeometry(TOMATO_RADIUS, 64, 48);
    const posAttr = sphereGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const angle = Math.atan2(v.z, v.x);
      const heightRatio = v.y / TOMATO_RADIUS;

      // 6-lobed natural furrow
      const lobeIndent = 1.0 + 0.07 * Math.cos(6 * angle) * (1 - Math.abs(heightRatio));
      const verticalSquash = heightRatio > 0 ? 0.90 : 0.83;

      v.x *= lobeIndent;
      v.z *= lobeIndent;
      v.y *= verticalSquash;

      // Stem apical dimple
      if (v.y > 0.52) {
        v.y -= 0.14 * Math.exp(-((v.x * v.x + v.z * v.z) / 0.18));
      }
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    sphereGeo.computeVertexNormals();

    const tomatoMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xE11D48,
      emissive: 0x3B0716,
      emissiveIntensity: 0.15,
      roughness: 0.16,
      metalness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.98
    });

    const tomatoMesh = new THREE.Mesh(sphereGeo, tomatoMaterial);
    tomatoMesh.castShadow = true;
    tomatoMesh.receiveShadow = true;
    tomatoMesh.position.y = TOMATO_RADIUS * 0.85;
    tomatoRoot.add(tomatoMesh);

    // Calyx & Curving Green Stem
    const calyxGroup = new THREE.Group();
    calyxGroup.position.set(0, TOMATO_RADIUS * 0.85 + 0.68, 0);

    const calyxMat = new THREE.MeshStandardMaterial({
      color: 0x15803D,
      roughness: 0.42,
      metalness: 0.06,
      side: THREE.DoubleSide
    });

    // 6 Curled Sepal Leaves
    const NUM_SEPALS = 6;
    for (let i = 0; i < NUM_SEPALS; i++) {
      const theta = (i / NUM_SEPALS) * Math.PI * 2;
      const sepalGeo = new THREE.ConeGeometry(0.12, 0.62, 5);
      sepalGeo.rotateX(Math.PI / 2.15);
      const sepal = new THREE.Mesh(sepalGeo, calyxMat);
      sepal.rotation.y = theta;
      sepal.position.set(Math.cos(theta) * 0.15, -0.02, Math.sin(theta) * 0.15);
      calyxGroup.add(sepal);
    }

    // Natural Organic Curved Stem
    const stemCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.09, 0.42, 0.07),
      new THREE.Vector3(0.18, 0.74, -0.08)
    );
    const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.058, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, calyxMat);
    calyxGroup.add(stemMesh);
    tomatoMesh.add(calyxGroup);

    // Mascot Face Group (Animated Eyes & Cheeks)
    const mascotFaceGroup = new THREE.Group();
    mascotFaceGroup.position.set(0, 0.05, TOMATO_RADIUS * 0.93);

    const eyeGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });

    const eyePupilGeo = new THREE.SphereGeometry(0.032, 16, 16);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.1, 0);
    const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    leftPupil.position.set(-0.02, 0.02, 0.07);
    leftEye.add(leftPupil);
    mascotFaceGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.1, 0);
    const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    rightPupil.position.set(-0.02, 0.02, 0.07);
    rightEye.add(rightPupil);
    mascotFaceGroup.add(rightEye);

    // Cheerful Pink Blush
    const blushGeo = new THREE.CircleGeometry(0.075, 16);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xF43F5E, transparent: true, opacity: 0.65 });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.35, -0.06, 0.02);
    mascotFaceGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.35, -0.06, 0.02);
    mascotFaceGroup.add(rightBlush);

    // Cute Smile Arc
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.10, -0.06, 0.04),
      new THREE.Vector3(0, -0.16, 0.05),
      new THREE.Vector3(0.10, -0.06, 0.04)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 12, 0.016, 6, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    mascotFaceGroup.add(smileMesh);

    mascotFaceGroup.visible = mascotMode;
    tomatoMesh.add(mascotFaceGroup);

    // Soft Ambient Contact Shadow
    const shadowGeo = new THREE.CircleGeometry(TOMATO_RADIUS * 1.15, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58 });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.016;
    scene.add(contactShadow);

    // 5. Turbo Particle Exhaust Trail
    const TURBO_PARTICLE_COUNT = 30;
    const turboGeo = new THREE.BufferGeometry();
    const turboPositions = new Float32Array(TURBO_PARTICLE_COUNT * 3);
    turboGeo.setAttribute('position', new THREE.BufferAttribute(turboPositions, 3));
    const turboMat = new THREE.PointsMaterial({
      color: 0x38BDF8,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const turboParticles = new THREE.Points(turboGeo, turboMat);
    turboParticles.visible = false;
    scene.add(turboParticles);

    // 6. Collectible Bio-Energy Orbs (Mini-Game Feature)
    const collectibles: CollectibleOrb[] = [];
    const orbGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const orbGlowGeo = new THREE.SphereGeometry(0.34, 16, 16);

    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x34D399,
      emissive: 0x10B981,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.2
    });
    const orbGlowMat = new THREE.MeshBasicMaterial({
      color: 0x6EE7B7,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });

    const spawnPositions = [
      { x: -3.2, z: -3.0 },
      { x: 3.4, z: -2.8 },
      { x: -3.0, z: 3.2 },
      { x: 3.1, z: 3.0 },
      { x: 0.0, z: -4.2 }
    ];

    spawnPositions.forEach((pos) => {
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      const orbGlowMesh = new THREE.Mesh(orbGlowGeo, orbGlowMat);
      orbMesh.position.set(pos.x, 0.45, pos.z);
      orbGlowMesh.position.copy(orbMesh.position);
      scene.add(orbMesh);
      scene.add(orbGlowMesh);

      collectibles.push({
        mesh: orbMesh,
        glowMesh: orbGlowMesh,
        x: pos.x,
        z: pos.z,
        active: true,
        baseY: 0.45
      });
    });

    // 7. Ambient Dust Motes / Spores
    const SPORE_COUNT = 75;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(SPORE_COUNT * 3);
    for (let i = 0; i < SPORE_COUNT; i++) {
      sporePositions[i * 3 + 0] = (Math.random() - 0.5) * 15;
      sporePositions[i * 3 + 1] = Math.random() * 3.5;
      sporePositions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
    const sporeMat = new THREE.PointsMaterial({
      color: 0x34D399,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const spores = new THREE.Points(sporeGeo, sporeMat);
    scene.add(spores);

    // 8. Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const p = physicsRef.current.keys;
      if (k === 'w' || k === 'arrowup') p.w = true;
      if (k === 'a' || k === 'arrowleft') p.a = true;
      if (k === 's' || k === 'arrowdown') p.s = true;
      if (k === 'd' || k === 'arrowright') p.d = true;
      if (e.key === 'Shift') {
        p.shift = true;
        setCurrentExpression('boost');
        playSoundEffect('boost');
      }
      if (k === 'q' || k === 'e') {
        if (!physicsRef.current.isSpinning) {
          physicsRef.current.isSpinning = true;
          physicsRef.current.spinVelocity = k === 'q' ? -14.0 : 14.0;
          playSoundEffect('spin');
          if (onInteract) onInteract('SPIN');
        }
      }
      if (k === ' ' && !physicsRef.current.isJumping) {
        p.space = true;
        physicsRef.current.isJumping = true;
        physicsRef.current.jumpVelocity = 0.27;
        setBounces(b => b + 1);
        setCurrentExpression('jump');
        playSoundEffect('boing');
        if (onInteract) onInteract('JUMP');
      }
      setActiveKeys({ ...p });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const p = physicsRef.current.keys;
      if (k === 'w' || k === 'arrowup') p.w = false;
      if (k === 'a' || k === 'arrowleft') p.a = false;
      if (k === 's' || k === 'arrowdown') p.s = false;
      if (k === 'd' || k === 'arrowright') p.d = false;
      if (e.key === 'Shift') {
        p.shift = false;
        setCurrentExpression('normal');
      }
      if (k === ' ') p.space = false;
      setActiveKeys({ ...p });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 9. Mouse Orbit & Zoom Dragging
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraAngleY = 0;
    let cameraAngleX = 0.35;
    let cameraDistance = 8.5;

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraAngleY -= deltaX * 0.007;
      cameraAngleX = Math.max(0.08, Math.min(1.2, cameraAngleX + deltaY * 0.007));
    };

    const handleMouseUp = () => { isDragging = false; };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance = Math.max(4.5, Math.min(15.0, cameraDistance + e.deltaY * 0.005));
    };

    mount.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    mount.addEventListener('wheel', handleWheel, { passive: false });

    // 10. Main Animation & Physics Loop
    let animId: number;
    const BASE_ACCEL = 0.011;
    const FRICTION = 0.935;
    const BASE_MAX_SPEED = 0.19;

    const clock = new THREE.Clock();
    let pulseTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      pulseTime += delta;
      const p = physicsRef.current;

      mascotFaceGroup.visible = mascotMode;

      // Adjust dynamic expression scale
      if (currentExpression === 'jump') {
        leftEye.scale.set(1.3, 1.3, 1.3);
        rightEye.scale.set(1.3, 1.3, 1.3);
      } else if (currentExpression === 'boost') {
        leftEye.scale.set(1.1, 0.8, 1.0);
        rightEye.scale.set(1.1, 0.8, 1.0);
      } else {
        leftEye.scale.set(1.0, 1.0, 1.0);
        rightEye.scale.set(1.0, 1.0, 1.0);
      }

      // Turbo Multiplier
      const isTurbo = p.keys.shift;
      const accel = isTurbo ? BASE_ACCEL * 1.85 : BASE_ACCEL;
      const maxSpeed = isTurbo ? BASE_MAX_SPEED * 1.85 : BASE_MAX_SPEED;

      // Direction inputs
      let ax = 0;
      let az = 0;
      if (p.keys.w) az -= accel;
      if (p.keys.s) az += accel;
      if (p.keys.a) ax -= accel;
      if (p.keys.d) ax += accel;

      p.vel.x = THREE.MathUtils.clamp(p.vel.x + ax, -maxSpeed, maxSpeed) * FRICTION;
      p.vel.z = THREE.MathUtils.clamp(p.vel.z + az, -maxSpeed, maxSpeed) * FRICTION;

      p.pos.x += p.vel.x;
      p.pos.z += p.vel.z;

      // Arena boundary collision with rubbery rebound
      const dist = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
      if (dist > ARENA_RADIUS - 0.4) {
        const angle = Math.atan2(p.pos.z, p.pos.x);
        p.pos.x = Math.cos(angle) * (ARENA_RADIUS - 0.4);
        p.pos.z = Math.sin(angle) * (ARENA_RADIUS - 0.4);
        p.vel.x *= -0.65;
        p.vel.z *= -0.65;
        playSoundEffect('boing');
      }

      const currentSpeed = Math.sqrt(p.vel.x * p.vel.x + p.vel.z * p.vel.z);
      setSpeedGauge(Math.round((currentSpeed / maxSpeed) * 100));

      // Rolling rotation around physics movement axes
      tomatoMesh.rotation.z -= (p.vel.x / TOMATO_RADIUS) * 1.35;
      tomatoMesh.rotation.x += (p.vel.z / TOMATO_RADIUS) * 1.35;

      // 360 Spin Trick Handling
      if (p.isSpinning) {
        p.spinAngle += p.spinVelocity * delta;
        tomatoRoot.rotation.y = p.spinAngle;
        p.spinVelocity *= 0.94;
        if (Math.abs(p.spinVelocity) < 0.2) {
          p.isSpinning = false;
          p.spinVelocity = 0;
          tomatoRoot.rotation.y = 0;
        }
      }

      // Jumping & Squash/Stretch Elasticity
      if (p.isJumping) {
        p.pos.y += p.jumpVelocity;
        p.jumpVelocity -= 0.0135; // Gravity

        p.squashFactor = THREE.MathUtils.lerp(p.squashFactor, 1.22, 0.16);

        if (p.pos.y <= 0) {
          p.pos.y = 0;
          p.isJumping = false;
          p.jumpVelocity = 0;
          p.squashFactor = 0.74; // Impact squash rebound
          setCurrentExpression('normal');
          playSoundEffect('boing');
        }
      } else {
        p.squashFactor = THREE.MathUtils.lerp(p.squashFactor, 1.0, 0.12);
      }

      // Squash and stretch matrix deformation
      tomatoMesh.scale.set(
        1.0 / Math.sqrt(p.squashFactor),
        p.squashFactor,
        1.0 / Math.sqrt(p.squashFactor)
      );

      tomatoRoot.position.set(p.pos.x, p.pos.y, p.pos.z);

      // Contact Shadow Scaling
      contactShadow.position.set(p.pos.x, 0.016, p.pos.z);
      const shadowScale = Math.max(0.25, 1.0 - p.pos.y * 0.22);
      contactShadow.scale.set(shadowScale, shadowScale, shadowScale);
      shadowMat.opacity = Math.max(0.12, 0.58 - p.pos.y * 0.16);

      // Turbo Exhaust Particles Emission
      if (isTurbo && currentSpeed > 0.05) {
        turboParticles.visible = true;
        const positions = turboParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < TURBO_PARTICLE_COUNT; i++) {
          positions[i * 3 + 0] = p.pos.x - p.vel.x * 4 + (Math.random() - 0.5) * 0.3;
          positions[i * 3 + 1] = p.pos.y + 0.2 + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 2] = p.pos.z - p.vel.z * 4 + (Math.random() - 0.5) * 0.3;
        }
        turboParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        turboParticles.visible = false;
      }

      // Collectible Orbs Collision & Floating Animation
      collectibles.forEach((item) => {
        if (!item.active) return;
        item.mesh.rotation.y += delta * 1.8;
        item.glowMesh.rotation.y -= delta * 1.4;
        item.mesh.position.y = item.baseY + Math.sin(pulseTime * 3 + item.x) * 0.12;
        item.glowMesh.position.y = item.mesh.position.y;

        // Distance check with tomato
        const dx = p.pos.x - item.x;
        const dz = p.pos.z - item.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < TOMATO_RADIUS + 0.35 && p.pos.y < 0.6) {
          // Collected!
          item.active = false;
          item.mesh.visible = false;
          item.glowMesh.visible = false;
          setScore(s => s + 100);
          playSoundEffect('collect');

          // Respawn in a new random location after 3 seconds
          setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const r = 2.0 + Math.random() * (ARENA_RADIUS - 2.8);
            item.x = Math.cos(angle) * r;
            item.z = Math.sin(angle) * r;
            item.mesh.position.set(item.x, item.baseY, item.z);
            item.glowMesh.position.set(item.x, item.baseY, item.z);
            item.mesh.visible = true;
            item.glowMesh.visible = true;
            item.active = true;
          }, 3200);
        }
      });

      // Animated Ring Pulses
      const pulseScale = 1.0 + 0.08 * Math.sin(pulseTime * 2.5);
      pulseRing.scale.set(pulseScale, pulseScale, 1);

      // Camera Logic: Orbit vs Chase
      if (cameraMode === 'chase') {
        // Chase Cam behind tomato motion
        const moveAngle = Math.atan2(p.vel.x, p.vel.z);
        const targetCamX = p.pos.x - Math.sin(moveAngle) * 5.2;
        const targetCamZ = p.pos.z - Math.cos(moveAngle) * 5.2;
        const targetCamY = p.pos.y + 3.4;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.06);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.06);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.06);
        camera.lookAt(p.pos.x, p.pos.y + 0.5, p.pos.z);
      } else {
        // Free Orbit Mode
        camera.position.x = p.pos.x + cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);
        camera.position.z = p.pos.z + cameraDistance * Math.cos(cameraAngleY) * Math.cos(cameraAngleX);
        camera.position.y = p.pos.y + cameraDistance * Math.sin(cameraAngleX) + 1.2;
        camera.lookAt(p.pos.x, p.pos.y + 0.6, p.pos.z);
      }

      // Spore particles floating
      const posArr = spores.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] += Math.sin(delta * 2 + i) * 0.003;
      }
      spores.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      mount.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      mount.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resetPosition, onInteract, mascotMode, playSoundEffect, cameraMode, currentExpression]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Floating HUD Telemetry (Top Left) */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '8px 14px',
          borderRadius: 12,
          color: '#FFF',
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          <Sparkles size={16} color="#F43F5E" />
          <span>Interactive 3D Tomato Engine</span>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          background: 'rgba(9, 13, 22, 0.82)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '8px 14px',
          borderRadius: 12,
          color: '#94A3B8',
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={14} color="#38BDF8" />
            <span style={{ color: speedGauge > 80 ? '#F43F5E' : '#38BDF8' }}>
              SPD: {speedGauge}%
            </span>
          </div>
          <div>BOUNCES: <span style={{ color: '#10B981' }}>{bounces}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trophy size={14} color="#FBBF24" />
            <span style={{ color: '#FBBF24' }}>SCORE: {score}</span>
          </div>
        </div>
      </div>

      {/* Mode Switches & Settings (Top Right) */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        gap: 8,
        zIndex: 10
      }}>
        {/* Camera Mode Toggle */}
        <button
          onClick={() => setCameraMode(cameraMode === 'orbit' ? 'chase' : 'orbit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: cameraMode === 'chase' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${cameraMode === 'chase' ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
            color: cameraMode === 'chase' ? '#38BDF8' : '#E2E8F0',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
          title="Ganti Mode Kamera"
        >
          <CameraIcon size={15} />
          <span>{cameraMode === 'orbit' ? 'Orbit Cam' : 'Chase Cam'}</span>
        </button>

        {/* Mascot Face Mode */}
        <button
          onClick={() => setMascotMode(!mascotMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: mascotMode ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${mascotMode ? '#F43F5E' : 'rgba(255, 255, 255, 0.12)'}`,
            color: mascotMode ? '#F43F5E' : '#E2E8F0',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
        >
          {mascotMode ? <Smile size={15} /> : <Eye size={15} />}
          <span>{mascotMode ? 'Mascot Face' : 'Organic'}</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isAudioEnabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${isAudioEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.12)'}`,
            color: isAudioEnabled ? '#34D399' : '#94A3B8',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
        >
          {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span>{isAudioEnabled ? 'Sound ON' : 'Muted'}</span>
        </button>

        {/* Guide Toggle */}
        <button
          onClick={() => setShowControlsGuide(!showControlsGuide)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#E2E8F0',
            padding: '8px 10px',
            borderRadius: 10,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
          title="Panduan Kontrol"
        >
          <HelpCircle size={15} />
        </button>
      </div>

      {/* Pop-up Controls Guide Overlay */}
      {showControlsGuide && (
        <div style={{
          position: 'absolute',
          top: 66,
          right: 20,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 16,
          padding: 18,
          width: 270,
          zIndex: 20,
          color: '#E2E8F0',
          fontSize: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#38BDF8' }}>
            🎮 Kontrol Tomat 3D
          </div>
          <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
            <li><strong>W, A, S, D</strong> atau Panah: Menggelinding</li>
            <li><strong>SPASI</strong>: Melompat (Elastic Bounce)</li>
            <li><strong>SHIFT</strong>: Turbo Boost + Api Biru!</li>
            <li><strong>Q / E</strong>: 360° Aerial Spin Trick</li>
            <li><strong>Tarik Mouse</strong>: Orbit & Putar Kamera</li>
            <li><strong>Scroll Mouse</strong>: Zoom In / Out</li>
          </ul>
        </div>
      )}

      {/* Interactive Tactile HUD Gamepad (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(9, 13, 22, 0.88)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '12px 16px',
        borderRadius: 20,
        zIndex: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.6 }}>
          WASD GAMEPAD
        </div>

        {/* W Button */}
        <button
          onMouseDown={() => triggerKeyAction('w', true)}
          onMouseUp={() => triggerKeyAction('w', false)}
          onTouchStart={() => triggerKeyAction('w', true)}
          onTouchEnd={() => triggerKeyAction('w', false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: activeKeys['w'] ? '#F43F5E' : 'rgba(255, 255, 255, 0.08)',
            color: activeKeys['w'] ? '#FFF' : '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: activeKeys['w'] ? '0 0 14px #F43F5E' : 'none',
            cursor: 'pointer',
            transition: 'background 0.1s'
          }}
        >
          <ArrowUp size={16} />
        </button>

        {/* A, S, D Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'a' as const, icon: <ArrowLeft size={16} /> },
            { key: 's' as const, icon: <ArrowDown size={16} /> },
            { key: 'd' as const, icon: <ArrowRight size={16} /> }
          ].map(btn => (
            <button
              key={btn.key}
              onMouseDown={() => triggerKeyAction(btn.key, true)}
              onMouseUp={() => triggerKeyAction(btn.key, false)}
              onTouchStart={() => triggerKeyAction(btn.key, true)}
              onTouchEnd={() => triggerKeyAction(btn.key, false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: activeKeys[btn.key] ? '#F43F5E' : 'rgba(255, 255, 255, 0.08)',
                color: activeKeys[btn.key] ? '#FFF' : '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: activeKeys[btn.key] ? '0 0 14px #F43F5E' : 'none',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Special Action Buttons: Boost, Jump, Trick */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {/* Turbo Boost */}
          <button
            onMouseDown={() => triggerKeyAction('shift', true)}
            onMouseUp={() => triggerKeyAction('shift', false)}
            onTouchStart={() => triggerKeyAction('shift', true)}
            onTouchEnd={() => triggerKeyAction('shift', false)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: activeKeys['shift'] ? '#38BDF8' : 'rgba(56, 189, 248, 0.12)',
              color: activeKeys['shift'] ? '#000' : '#38BDF8',
              fontSize: 10,
              fontWeight: 800,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: activeKeys['shift'] ? '0 0 12px #38BDF8' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Flame size={12} />
            <span>TURBO</span>
          </button>

          {/* Jump Space */}
          <button
            onMouseDown={() => triggerKeyAction('space', true)}
            onMouseUp={() => triggerKeyAction('space', false)}
            onTouchStart={() => triggerKeyAction('space', true)}
            onTouchEnd={() => triggerKeyAction('space', false)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: activeKeys['space'] ? '#10B981' : 'rgba(16, 185, 129, 0.15)',
              color: activeKeys['space'] ? '#FFF' : '#34D399',
              fontSize: 10,
              fontWeight: 800,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: activeKeys['space'] ? '0 0 12px #10B981' : 'none',
              cursor: 'pointer'
            }}
          >
            JUMP
          </button>

          {/* 360 Spin */}
          <button
            onClick={() => triggerKeyAction('spin', true)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(244, 63, 94, 0.12)',
              color: '#FB7185',
              fontSize: 10,
              fontWeight: 800,
              border: '1px solid rgba(244, 63, 94, 0.3)',
              cursor: 'pointer'
            }}
          >
            SPIN
          </button>
        </div>
      </div>

      {/* Quick Reset Posisi (Bottom Right) */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: 8, zIndex: 10 }}>
        <button
          onClick={resetPosition}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#E2E8F0',
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          <RotateCcw size={14} />
          <span>Reset Posisi</span>
        </button>
      </div>
    </div>
  );
};
