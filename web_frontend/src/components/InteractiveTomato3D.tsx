import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
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
  Sun,
  Home
} from 'lucide-react';

interface InteractiveTomato3DProps {
  onInteract?: (action: string) => void;
}

interface CollectibleItem {
  mesh: THREE.Group;
  x: number;
  z: number;
  active: boolean;
  baseY: number;
}

export const InteractiveTomato3D: React.FC<InteractiveTomato3DProps> = ({ onInteract }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Game & UI States
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});
  const [speedGauge, setSpeedGauge] = useState<number>(0);
  const [bounces, setBounces] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [mascotMode, setMascotMode] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase'>('chase');
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>('Ruang Laboratorium Botani');

  // Web Audio Context Synthesizer
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

  const playSoundEffect = useCallback((type: 'boing' | 'collect' | 'boost' | 'spin') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'boing') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === 'collect') {
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.045);
          g.gain.setValueAtTime(0.12, now + idx * 0.045);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + idx * 0.045);
          o.stop(now + idx * 0.045 + 0.23);
        });
      } else if (type === 'boost') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (type === 'spin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.14, now);
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

  // Character Physics Kinematics State
  const physicsRef = useRef({
    pos: new THREE.Vector3(0, 0, 2), // Spawn inside the botanical greenhouse room
    vel: new THREE.Vector3(0, 0, 0),
    headingAngle: 0,
    targetHeading: 0,
    isJumping: false,
    jumpVelocity: 0,
    squashFactor: 1.0,
    waddlePhase: 0,
    stemSway: 0,
    isSpinning: false,
    spinVelocity: 0,
    keys: { w: false, a: false, s: false, d: false, space: false, shift: false, q: false, e: false }
  });

  const resetPosition = useCallback(() => {
    const p = physicsRef.current;
    p.pos.set(0, 0, 2);
    p.vel.set(0, 0, 0);
    p.isJumping = false;
    p.jumpVelocity = 0;
    p.squashFactor = 1.0;
    p.headingAngle = 0;
    p.targetHeading = 0;
    p.isSpinning = false;
    setLocationName('Ruang Laboratorium Botani');
  }, []);

  const triggerKeyAction = (key: 'w' | 'a' | 's' | 'd' | 'space' | 'shift' | 'spin', isDown: boolean) => {
    const p = physicsRef.current;
    if (key === 'spin' && isDown && !p.isSpinning) {
      p.isSpinning = true;
      p.spinVelocity = 15.0;
      playSoundEffect('spin');
      if (onInteract) onInteract('SPIN');
      return;
    }

    if (key === 'space' && isDown && !p.isJumping) {
      p.isJumping = true;
      p.jumpVelocity = 0.28;
      setBounces(b => b + 1);
      playSoundEffect('boing');
      if (onInteract) onInteract('JUMP');
    }

    if (key === 'shift') {
      p.keys.shift = isDown;
      if (isDown) playSoundEffect('boost');
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

    // 1. Scene & Daylight Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xBAE6FD); // Sky blue
    scene.fog = new THREE.FogExp2(0xD9F0FE, 0.016); // Soft atmospheric haze

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    camera.position.set(0, 5.0, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    // 2. Natural Sun & Sky Lighting
    const hemiLight = new THREE.HemisphereLight(0xBAE6FD, 0x22C55E, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xFFFBEB, 2.6);
    sunLight.position.set(16, 28, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    scene.add(sunLight);

    const greenhouseWarmGlow = new THREE.PointLight(0xFBBF24, 1.8, 14);
    greenhouseWarmGlow.position.set(0, 3.8, 0);
    scene.add(greenhouseWarmGlow);

    // 3. MAP ENVIRONMENT: VAST LUSH MEADOW (HAMPARAN LAPANGAN HIJAU)
    const MEADOW_SIZE = 90;
    const meadowGeo = new THREE.PlaneGeometry(MEADOW_SIZE, MEADOW_SIZE, 64, 64);
    
    // Slight undulating hills in the meadow vertices
    const mPos = meadowGeo.attributes.position;
    for (let i = 0; i < mPos.count; i++) {
      const vx = mPos.getX(i);
      const vy = mPos.getY(i);
      // Keep greenhouse area (radius < 12) flat, gently undulate outside
      const distFromCenter = Math.sqrt(vx * vx + vy * vy);
      if (distFromCenter > 11) {
        const hillHeight = Math.sin(vx * 0.12) * Math.cos(vy * 0.12) * 0.85;
        mPos.setZ(i, hillHeight);
      }
    }
    meadowGeo.computeVertexNormals();

    const meadowMat = new THREE.MeshStandardMaterial({
      color: 0x34A853, // Vibrant rich green
      roughness: 0.88,
      metalness: 0.04
    });
    const meadow = new THREE.Mesh(meadowGeo, meadowMat);
    meadow.rotation.x = -Math.PI / 2;
    meadow.position.y = -0.02;
    meadow.receiveShadow = true;
    scene.add(meadow);

    // Garden Pathway leading out of greenhouse
    const pathGeo = new THREE.PlaneGeometry(3.6, 18);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xD7CCC8, // Warm limestone pavers
      roughness: 0.8,
      metalness: 0.1
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.01, 13);
    path.receiveShadow = true;
    scene.add(path);

    // Rustic Wooden Fence around field perimeter
    const fenceGroup = new THREE.Group();
    const FENCE_RADIUS = 36;
    const NUM_FENCE_POSTS = 32;
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8);
    const railGeo = new THREE.BoxGeometry(0.1, 0.14, 6.8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.9 });

    for (let i = 0; i < NUM_FENCE_POSTS; i++) {
      const angle = (i / NUM_FENCE_POSTS) * Math.PI * 2;
      const px = Math.cos(angle) * FENCE_RADIUS;
      const pz = Math.sin(angle) * FENCE_RADIUS;

      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 0.7, pz);
      post.castShadow = true;
      fenceGroup.add(post);

      const rail = new THREE.Mesh(railGeo, woodMat);
      rail.position.set(px, 0.9, pz);
      rail.rotation.y = angle + Math.PI / 2;
      rail.castShadow = true;
      fenceGroup.add(rail);
    }
    scene.add(fenceGroup);

    // Tomato Shrubs & Wildflowers Scattered in the Meadow
    const bushGroup = new THREE.Group();
    const shrubGeo = new THREE.DodecahedronGeometry(0.9, 1);
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.75 });
    const miniTomatoGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const miniTomatoMat = new THREE.MeshStandardMaterial({ color: 0xE11D48, roughness: 0.2 });

    const shrubCoords = [
      { x: -14, z: -10 }, { x: 15, z: -8 }, { x: -16, z: 12 }, { x: 17, z: 14 },
      { x: -20, z: -2 }, { x: 22, z: 2 }, { x: -8, z: 24 }, { x: 8, z: 24 }
    ];

    shrubCoords.forEach(pos => {
      const shrub = new THREE.Mesh(shrubGeo, shrubMat);
      shrub.position.set(pos.x, 0.75, pos.z);
      shrub.scale.set(1.4, 1.2, 1.4);
      shrub.castShadow = true;
      bushGroup.add(shrub);

      // Add a couple of mini ripe tomatoes on the shrub
      for (let j = 0; j < 3; j++) {
        const miniT = new THREE.Mesh(miniTomatoGeo, miniTomatoMat);
        miniT.position.set(
          pos.x + (Math.random() - 0.5) * 1.0,
          0.6 + Math.random() * 0.6,
          pos.z + (Math.random() - 0.5) * 1.0
        );
        miniT.castShadow = true;
        bushGroup.add(miniT);
      }
    });
    scene.add(bushGroup);

    // 4. THE BOTANICAL GREENHOUSE PAVILION (RUANGAN DI TENGAN HAMAPARAN HIJAU)
    const greenhouse = new THREE.Group();
    greenhouse.position.set(0, 0, 0);

    const GH_WIDTH = 13.0;
    const GH_DEPTH = 15.0;
    const GH_WALL_H = 4.2;

    // A. Indoor Terracotta Parquet Tile Floor
    const floorTileGeo = new THREE.BoxGeometry(GH_WIDTH, 0.16, GH_DEPTH);
    const floorTileMat = new THREE.MeshStandardMaterial({
      color: 0xC2410C, // Warm terracotta stone
      roughness: 0.45,
      metalness: 0.15
    });
    const ghFloor = new THREE.Mesh(floorTileGeo, floorTileMat);
    ghFloor.position.set(0, 0.08, 0);
    ghFloor.receiveShadow = true;
    greenhouse.add(ghFloor);

    // Base Floor Foundation Rim
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const rimGeo = new THREE.BoxGeometry(GH_WIDTH + 0.4, 0.22, GH_DEPTH + 0.4);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(0, 0.05, 0);
    rim.receiveShadow = true;
    greenhouse.add(rim);

    // B. Architectural Steel Frame Columns
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.35, metalness: 0.85 });
    const colGeo = new THREE.BoxGeometry(0.35, GH_WALL_H, 0.35);

    const colPositions = [
      { x: -GH_WIDTH / 2, z: -GH_DEPTH / 2 },
      { x: GH_WIDTH / 2, z: -GH_DEPTH / 2 },
      { x: -GH_WIDTH / 2, z: GH_DEPTH / 2 },
      { x: GH_WIDTH / 2, z: GH_DEPTH / 2 },
      // Entrance columns flanking the open door
      { x: -2.4, z: GH_DEPTH / 2 },
      { x: 2.4, z: GH_DEPTH / 2 }
    ];

    colPositions.forEach(c => {
      const col = new THREE.Mesh(colGeo, steelMat);
      col.position.set(c.x, GH_WALL_H / 2 + 0.1, c.z);
      col.castShadow = true;
      greenhouse.add(col);
    });

    // C. Translucent Glass Walls
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xE0F2FE,
      transparent: true,
      opacity: 0.32,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      reflectivity: 0.8
    });

    // Back Glass Wall
    const backWallGeo = new THREE.PlaneGeometry(GH_WIDTH, GH_WALL_H);
    const backWall = new THREE.Mesh(backWallGeo, glassMat);
    backWall.position.set(0, GH_WALL_H / 2 + 0.1, -GH_DEPTH / 2);
    greenhouse.add(backWall);

    // Left Glass Wall
    const sideWallGeo = new THREE.PlaneGeometry(GH_DEPTH, GH_WALL_H);
    const leftWall = new THREE.Mesh(sideWallGeo, glassMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-GH_WIDTH / 2, GH_WALL_H / 2 + 0.1, 0);
    greenhouse.add(leftWall);

    // Right Glass Wall
    const rightWall = new THREE.Mesh(sideWallGeo, glassMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(GH_WIDTH / 2, GH_WALL_H / 2 + 0.1, 0);
    greenhouse.add(rightWall);

    // Front Glass Wall Panels (Leaving 4.8m wide doorway open!)
    const frontSideGeo = new THREE.PlaneGeometry((GH_WIDTH - 4.8) / 2, GH_WALL_H);
    const frontLeft = new THREE.Mesh(frontSideGeo, glassMat);
    frontLeft.position.set(-GH_WIDTH / 2 + (GH_WIDTH - 4.8) / 4, GH_WALL_H / 2 + 0.1, GH_DEPTH / 2);
    greenhouse.add(frontLeft);

    const frontRight = new THREE.Mesh(frontSideGeo, glassMat);
    frontRight.position.set(GH_WIDTH / 2 - (GH_WIDTH - 4.8) / 4, GH_WALL_H / 2 + 0.1, GH_DEPTH / 2);
    greenhouse.add(frontRight);

    // D. Glass Gable Roof & Trusses
    const ROOF_PEAK_H = 6.2;
    const roofBeamMat = steelMat;
    const ridgeBeamGeo = new THREE.BoxGeometry(0.3, 0.3, GH_DEPTH);
    const ridgeBeam = new THREE.Mesh(ridgeBeamGeo, roofBeamMat);
    ridgeBeam.position.set(0, ROOF_PEAK_H, 0);
    ridgeBeam.castShadow = true;
    greenhouse.add(ridgeBeam);

    // Slanted Glass Roof Panels
    const roofSlopeLen = Math.sqrt(Math.pow(GH_WIDTH / 2, 2) + Math.pow(ROOF_PEAK_H - (GH_WALL_H + 0.1), 2));
    const roofSlopeAngle = Math.atan2(ROOF_PEAK_H - (GH_WALL_H + 0.1), GH_WIDTH / 2);
    const roofGeo = new THREE.PlaneGeometry(roofSlopeLen, GH_DEPTH);

    const leftRoof = new THREE.Mesh(roofGeo, glassMat);
    leftRoof.position.set(-GH_WIDTH / 4, (ROOF_PEAK_H + GH_WALL_H) / 2, 0);
    leftRoof.rotation.y = Math.PI / 2;
    leftRoof.rotation.x = Math.PI / 2 - roofSlopeAngle;
    greenhouse.add(leftRoof);

    const rightRoof = new THREE.Mesh(roofGeo, glassMat);
    rightRoof.position.set(GH_WIDTH / 4, (ROOF_PEAK_H + GH_WALL_H) / 2, 0);
    rightRoof.rotation.y = -Math.PI / 2;
    rightRoof.rotation.x = Math.PI / 2 - roofSlopeAngle;
    greenhouse.add(rightRoof);

    // E. Interior Laboratory Props (Meja Tanaman & Peti Panen)
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.7 });
    const benchGeo = new THREE.BoxGeometry(1.6, 0.9, 5.0);

    // Left Plant Bench
    const leftBench = new THREE.Mesh(benchGeo, benchMat);
    leftBench.position.set(-GH_WIDTH / 2 + 1.2, 0.45 + 0.16, 0);
    leftBench.castShadow = true;
    leftBench.receiveShadow = true;
    greenhouse.add(leftBench);

    // Right Plant Bench
    const rightBench = new THREE.Mesh(benchGeo, benchMat);
    rightBench.position.set(GH_WIDTH / 2 - 1.2, 0.45 + 0.16, 0);
    rightBench.castShadow = true;
    rightBench.receiveShadow = true;
    greenhouse.add(rightBench);

    // Ceramic Pots on Left Bench
    const potGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.35, 12);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xA1887F, roughness: 0.5 });
    for (let pIdx = -2; pIdx <= 2; pIdx++) {
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(-GH_WIDTH / 2 + 1.2, 0.9 + 0.18 + 0.16, pIdx * 0.95);
      pot.castShadow = true;
      greenhouse.add(pot);

      // Little green sprout
      const sproutGeo = new THREE.ConeGeometry(0.12, 0.32, 6);
      const sproutMat = new THREE.MeshStandardMaterial({ color: 0x22C55E });
      const sprout = new THREE.Mesh(sproutGeo, sproutMat);
      sprout.position.set(-GH_WIDTH / 2 + 1.2, 0.9 + 0.35 + 0.16 + 0.16, pIdx * 0.95);
      greenhouse.add(sprout);
    }

    // Wooden Tomato Harvest Crates near back wall
    const crateGeo = new THREE.BoxGeometry(1.4, 0.65, 1.0);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xA08050, roughness: 0.85 });
    const crate1 = new THREE.Mesh(crateGeo, crateMat);
    crate1.position.set(-2.5, 0.32 + 0.16, -GH_DEPTH / 2 + 1.4);
    crate1.castShadow = true;
    greenhouse.add(crate1);

    const crate2 = new THREE.Mesh(crateGeo, crateMat);
    crate2.position.set(2.5, 0.32 + 0.16, -GH_DEPTH / 2 + 1.4);
    crate2.castShadow = true;
    greenhouse.add(crate2);

    scene.add(greenhouse);

    // 5. AAA ORGANIC TOMATO CHARACTER (UNIFIED KINEMATIC MODEL)
    const tomatoRoot = new THREE.Group();
    tomatoRoot.position.copy(physicsRef.current.pos);
    scene.add(tomatoRoot);

    const TOMATO_RADIUS = 0.95;

    // Body Container (Allows banking lean & squishy bounce without detaching stem!)
    const tomatoBody = new THREE.Group();
    tomatoRoot.add(tomatoBody);

    // Organic 6-Lobed Deformed Tomato Flesh
    const sphereGeo = new THREE.SphereGeometry(TOMATO_RADIUS, 64, 48);
    const posAttr = sphereGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const angle = Math.atan2(v.z, v.x);
      const heightRatio = v.y / TOMATO_RADIUS;

      // Natural botanical plump 6-lobed furrows
      const lobeIndent = 1.0 + 0.08 * Math.cos(6 * angle) * (1 - Math.abs(heightRatio));
      const verticalSquash = heightRatio > 0 ? 0.91 : 0.83;

      v.x *= lobeIndent;
      v.z *= lobeIndent;
      v.y *= verticalSquash;

      // Apical stem depression at the top pole
      if (v.y > 0.48) {
        v.y -= 0.16 * Math.exp(-((v.x * v.x + v.z * v.z) / 0.16));
      }
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    sphereGeo.computeVertexNormals();

    // High-Fidelity Organic Physical Skin Material
    const tomatoMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xDC2626, // Ripe tomato red
      emissive: 0x450A0A,
      emissiveIntensity: 0.18,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.07,
      reflectivity: 0.95
    });

    const tomatoMesh = new THREE.Mesh(sphereGeo, tomatoMaterial);
    tomatoMesh.castShadow = true;
    tomatoMesh.receiveShadow = true;
    tomatoMesh.position.y = TOMATO_RADIUS * 0.85;
    tomatoBody.add(tomatoMesh);

    // Dew Droplets on Tomato Skin
    const dewMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.95,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0
    });
    const dewGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const dewCoords = [
      { x: 0.42, y: 0.65, z: 0.55 },
      { x: -0.55, y: 0.50, z: 0.45 },
      { x: 0.25, y: 0.35, z: 0.75 },
      { x: -0.35, y: 0.20, z: -0.70 }
    ];
    dewCoords.forEach(d => {
      const dew = new THREE.Mesh(dewGeo, dewMat);
      dew.position.set(d.x, d.y, d.z);
      tomatoMesh.add(dew);
    });

    // Botanical Calyx & Stem (Firmly anchored on top with organic sepal drape)
    const calyxGroup = new THREE.Group();
    calyxGroup.position.set(0, TOMATO_RADIUS * 0.85 + 0.56, 0);

    const calyxMat = new THREE.MeshStandardMaterial({
      color: 0x15803D,
      roughness: 0.38,
      metalness: 0.06,
      side: THREE.DoubleSide
    });

    // 6 Star Sepals draping gracefully over tomato shoulders
    const NUM_SEPALS = 6;
    for (let i = 0; i < NUM_SEPALS; i++) {
      const theta = (i / NUM_SEPALS) * Math.PI * 2;
      const sepalGeo = new THREE.ConeGeometry(0.13, 0.68, 5);
      sepalGeo.rotateX(Math.PI / 2.05); // Gently draping downwards
      const sepal = new THREE.Mesh(sepalGeo, calyxMat);
      sepal.rotation.y = theta;
      sepal.position.set(Math.cos(theta) * 0.16, -0.04, Math.sin(theta) * 0.16);
      calyxGroup.add(sepal);
    }

    // Curving Woody Stem with joint knot
    const stemCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.08, 0.45, 0.06),
      new THREE.Vector3(0.18, 0.82, -0.08)
    );
    const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.062, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, calyxMat);
    calyxGroup.add(stemMesh);
    tomatoBody.add(calyxGroup);

    // Mascot Face Elements (Attached directly to tomato body facing forward!)
    const mascotFaceGroup = new THREE.Group();
    mascotFaceGroup.position.set(0, TOMATO_RADIUS * 0.85, TOMATO_RADIUS * 0.90);

    const eyeGeo = new THREE.SphereGeometry(0.088, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
    const pupilGeo = new THREE.SphereGeometry(0.035, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    // Left Eye & Pupil
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.26, 0.08, 0);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.02, 0.02, 0.07);
    leftEye.add(leftPupil);
    mascotFaceGroup.add(leftEye);

    // Right Eye & Pupil
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.26, 0.08, 0);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(-0.02, 0.02, 0.07);
    rightEye.add(rightPupil);
    mascotFaceGroup.add(rightEye);

    // Blushing Rosy Cheeks
    const blushGeo = new THREE.CircleGeometry(0.08, 16);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xFB7185, transparent: true, opacity: 0.7 });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.38, -0.06, 0.03);
    mascotFaceGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.38, -0.06, 0.03);
    mascotFaceGroup.add(rightBlush);

    // Cheerful Smile
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.11, -0.05, 0.05),
      new THREE.Vector3(0, -0.16, 0.06),
      new THREE.Vector3(0.11, -0.05, 0.05)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 12, 0.018, 6, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    mascotFaceGroup.add(smileMesh);

    mascotFaceGroup.visible = mascotMode;
    tomatoBody.add(mascotFaceGroup);

    // Soft Outdoor Contact Shadow
    const shadowGeo = new THREE.CircleGeometry(TOMATO_RADIUS * 1.15, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x0A2F1D, transparent: true, opacity: 0.45 });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.012;
    scene.add(contactShadow);

    // 6. COLLECTIBLES: GOLDEN HEIRLOOM TOMATOES (Inside & Outside)
    const collectibles: CollectibleItem[] = [];
    const goldenTomatoGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const goldenTomatoMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B, // Golden Yellow
      emissive: 0xD97706,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.3
    });
    const goldenLeafGeo = new THREE.ConeGeometry(0.08, 0.22, 5);
    const goldenLeafMat = new THREE.MeshStandardMaterial({ color: 0x16A34A });

    const collectibleSpawnPoints = [
      { x: 0.0, z: -3.5 }, // Inside greenhouse back
      { x: -3.2, z: 0.5 },  // Inside greenhouse left bench
      { x: 3.2, z: 0.5 },   // Inside greenhouse right bench
      { x: 0.0, z: 12.0 },  // Outside on limestone pathway
      { x: -9.5, z: 14.0 }, // Outside on meadow left
      { x: 10.5, z: 15.0 }, // Outside on meadow right
      { x: -14.0, z: -4.0 } // Far meadow shrub area
    ];

    collectibleSpawnPoints.forEach(pt => {
      const cGroup = new THREE.Group();
      const gMesh = new THREE.Mesh(goldenTomatoGeo, goldenTomatoMat);
      gMesh.castShadow = true;
      cGroup.add(gMesh);

      const leaf = new THREE.Mesh(goldenLeafGeo, goldenLeafMat);
      leaf.position.y = 0.26;
      cGroup.add(leaf);

      cGroup.position.set(pt.x, 0.45, pt.z);
      scene.add(cGroup);

      collectibles.push({
        mesh: cGroup,
        x: pt.x,
        z: pt.z,
        active: true,
        baseY: 0.45
      });
    });

    // 7. Atmospheric Pollen & Dust Motes floating in daylight
    const MOTE_COUNT = 90;
    const moteGeo = new THREE.BufferGeometry();
    const motePositions = new Float32Array(MOTE_COUNT * 3);
    for (let i = 0; i < MOTE_COUNT; i++) {
      motePositions[i * 3 + 0] = (Math.random() - 0.5) * 35;
      motePositions[i * 3 + 1] = 0.2 + Math.random() * 4.5;
      motePositions[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xFEF08A, // Sunny golden pollen
      size: 0.08,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

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
        playSoundEffect('boost');
      }
      if (k === 'q' || k === 'e') {
        if (!physicsRef.current.isSpinning) {
          physicsRef.current.isSpinning = true;
          physicsRef.current.spinVelocity = k === 'q' ? -15.0 : 15.0;
          playSoundEffect('spin');
          if (onInteract) onInteract('SPIN');
        }
      }
      if (k === ' ' && !physicsRef.current.isJumping) {
        p.space = true;
        physicsRef.current.isJumping = true;
        physicsRef.current.jumpVelocity = 0.28;
        setBounces(b => b + 1);
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
      if (e.key === 'Shift') p.shift = false;
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
    let cameraAngleX = 0.42;
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
      cameraAngleX = Math.max(0.12, Math.min(1.25, cameraAngleX + deltaY * 0.007));
    };

    const handleMouseUp = () => { isDragging = false; };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance = Math.max(4.5, Math.min(18.0, cameraDistance + e.deltaY * 0.005));
    };

    mount.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    mount.addEventListener('wheel', handleWheel, { passive: false });

    // 10. UNIFIED KINEMATIC SIMULATION LOOP
    let animId: number;
    const BASE_ACCEL = 0.013;
    const FRICTION = 0.932;
    const BASE_MAX_SPEED = 0.20;

    const clock = new THREE.Clock();
    let pulseTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      pulseTime += delta;
      const p = physicsRef.current;

      mascotFaceGroup.visible = mascotMode;

      // Turbo Multiplier
      const isTurbo = p.keys.shift;
      const accel = isTurbo ? BASE_ACCEL * 1.85 : BASE_ACCEL;
      const maxSpeed = isTurbo ? BASE_MAX_SPEED * 1.85 : BASE_MAX_SPEED;

      // Compute Movement Inputs
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

      // Boundary Collision: Outer Field Perimeter Fence (Radius ~35m)
      const distFromCenter = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
      if (distFromCenter > FENCE_RADIUS - 1.2) {
        const angle = Math.atan2(p.pos.z, p.pos.x);
        p.pos.x = Math.cos(angle) * (FENCE_RADIUS - 1.2);
        p.pos.z = Math.sin(angle) * (FENCE_RADIUS - 1.2);
        p.vel.x *= -0.6;
        p.vel.z *= -0.6;
        playSoundEffect('boing');
      }

      // Greenhouse Doorway Collision Logic
      // Check if tomato is inside greenhouse vs outside meadow
      const inGH_X = Math.abs(p.pos.x) < GH_WIDTH / 2;
      const inGH_Z = p.pos.z > -GH_DEPTH / 2 && p.pos.z < GH_DEPTH / 2;
      const insideGreenhouse = inGH_X && inGH_Z;

      if (insideGreenhouse) {
        setLocationName('Ruang Laboratorium Botani');
        // Prevent walking through back and side walls
        if (p.pos.z < -GH_DEPTH / 2 + TOMATO_RADIUS) {
          p.pos.z = -GH_DEPTH / 2 + TOMATO_RADIUS;
          p.vel.z *= -0.5;
        }
        if (Math.abs(p.pos.x) > GH_WIDTH / 2 - TOMATO_RADIUS) {
          p.pos.x = Math.sign(p.pos.x) * (GH_WIDTH / 2 - TOMATO_RADIUS);
          p.vel.x *= -0.5;
        }
        // At front wall, only allow passage through open doorway (-2.2 to 2.2)
        if (p.pos.z > GH_DEPTH / 2 - TOMATO_RADIUS && p.pos.z < GH_DEPTH / 2 + 0.5) {
          if (Math.abs(p.pos.x) > 2.2) {
            p.pos.z = GH_DEPTH / 2 - TOMATO_RADIUS;
            p.vel.z *= -0.5;
          }
        }
      } else {
        setLocationName('Hamparan Lapangan Hijau');
        // Entering greenhouse through open doorway
        if (p.pos.z < GH_DEPTH / 2 + TOMATO_RADIUS && p.pos.z > GH_DEPTH / 2 - 0.5) {
          if (Math.abs(p.pos.x) > 2.2 && Math.abs(p.pos.x) < GH_WIDTH / 2 + 0.5) {
            p.pos.z = GH_DEPTH / 2 + TOMATO_RADIUS;
            p.vel.z *= -0.5;
          }
        }
      }

      const currentSpeed = Math.sqrt(p.vel.x * p.vel.x + p.vel.z * p.vel.z);
      setSpeedGauge(Math.round((currentSpeed / maxSpeed) * 100));

      // UNIFIED CHARACTER ORIENTATION (Tangkai Selalu di Atas, Wajah Menghadap Arah Gerak!)
      if (currentSpeed > 0.015) {
        p.targetHeading = Math.atan2(p.vel.x, p.vel.z);
        // Smooth interpolation of heading yaw
        p.headingAngle = THREE.MathUtils.lerp(p.headingAngle, p.targetHeading, 0.14);
        
        // Dynamic waddle oscillation (bouncing joyfully as it moves)
        p.waddlePhase += currentSpeed * 22;
      }

      tomatoRoot.position.set(p.pos.x, p.pos.y, p.pos.z);

      // Character Heading Yaw (Y-axis)
      if (!p.isSpinning) {
        tomatoRoot.rotation.y = p.headingAngle;
      } else {
        p.spinVelocity *= 0.94;
        tomatoRoot.rotation.y += p.spinVelocity * delta;
        if (Math.abs(p.spinVelocity) < 0.2) {
          p.isSpinning = false;
        }
      }

      // Dynamic Lean & Tilt (Banking into turns without detaching stem!)
      const targetRoll = (-p.vel.x / maxSpeed) * 0.25;
      const targetPitch = (p.vel.z / maxSpeed) * 0.20;
      tomatoBody.rotation.z = THREE.MathUtils.lerp(tomatoBody.rotation.z, targetRoll, 0.15);
      tomatoBody.rotation.x = THREE.MathUtils.lerp(tomatoBody.rotation.x, targetPitch, 0.15);

      // Dynamic Stem Sway (Secondary spring motion)
      p.stemSway = THREE.MathUtils.lerp(p.stemSway, -targetPitch * 1.5, 0.12);
      calyxGroup.rotation.x = p.stemSway + Math.sin(pulseTime * 4) * 0.05;

      // Waddle Squish when running
      const waddleBounce = currentSpeed > 0.02 ? Math.sin(p.waddlePhase) * 0.08 : 0;

      // Jumping & Elastic Bounce
      if (p.isJumping) {
        p.pos.y += p.jumpVelocity;
        p.jumpVelocity -= 0.014; // Gravity

        p.squashFactor = THREE.MathUtils.lerp(p.squashFactor, 1.25, 0.18);

        if (p.pos.y <= 0) {
          p.pos.y = 0;
          p.isJumping = false;
          p.jumpVelocity = 0;
          p.squashFactor = 0.72; // Impact squash
          playSoundEffect('boing');
        }
      } else {
        p.squashFactor = THREE.MathUtils.lerp(p.squashFactor, 1.0 + waddleBounce, 0.14);
      }

      tomatoBody.scale.set(
        1.0 / Math.sqrt(p.squashFactor),
        p.squashFactor,
        1.0 / Math.sqrt(p.squashFactor)
      );

      // Outdoor Contact Shadow
      contactShadow.position.set(p.pos.x, 0.014, p.pos.z);
      const shadowScale = Math.max(0.25, 1.0 - p.pos.y * 0.22);
      contactShadow.scale.set(shadowScale, shadowScale, shadowScale);
      shadowMat.opacity = Math.max(0.12, 0.45 - p.pos.y * 0.15);

      // Collectibles Rotation & Collision Check
      collectibles.forEach(item => {
        if (!item.active) return;
        item.mesh.rotation.y += delta * 2.2;
        item.mesh.position.y = item.baseY + Math.sin(pulseTime * 3 + item.x) * 0.12;

        const dx = p.pos.x - item.x;
        const dz = p.pos.z - item.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < TOMATO_RADIUS + 0.45 && p.pos.y < 0.7) {
          item.active = false;
          item.mesh.visible = false;
          setScore(s => s + 100);
          playSoundEffect('collect');

          setTimeout(() => {
            item.mesh.visible = true;
            item.active = true;
          }, 3500);
        }
      });

      // Camera Modes: Chase Cam vs Orbit Cam
      if (cameraMode === 'chase') {
        const camDistance = 8.0;
        const camHeight = 3.6;
        const camAngle = p.headingAngle;

        const targetCamX = p.pos.x - Math.sin(camAngle) * camDistance;
        const targetCamZ = p.pos.z - Math.cos(camAngle) * camDistance;
        const targetCamY = p.pos.y + camHeight;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.08);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
        camera.lookAt(p.pos.x, p.pos.y + 0.9, p.pos.z);
      } else {
        // Free Orbit Mode
        camera.position.x = p.pos.x + cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);
        camera.position.z = p.pos.z + cameraDistance * Math.cos(cameraAngleY) * Math.cos(cameraAngleX);
        camera.position.y = p.pos.y + cameraDistance * Math.sin(cameraAngleX) + 1.2;
        camera.lookAt(p.pos.x, p.pos.y + 0.8, p.pos.z);
      }

      // Pollen Motes floating animation
      const posArr = motes.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] += Math.sin(delta * 2 + i) * 0.002;
      }
      motes.geometry.attributes.position.needsUpdate = true;

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
  }, [resetPosition, onInteract, mascotMode, playSoundEffect, cameraMode]);

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
        {/* Location Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '8px 14px',
          borderRadius: 12,
          color: '#FFF',
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {locationName.includes('Laboratorium') ? <Home size={16} color="#FBBF24" /> : <Sun size={16} color="#34D399" />}
          <span>{locationName}</span>
        </div>

        {/* Speed, Bounces, Score HUD */}
        <div style={{
          display: 'flex',
          gap: 12,
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
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
            background: cameraMode === 'chase' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.75)',
            border: `1px solid ${cameraMode === 'chase' ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)'}`,
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
            background: mascotMode ? 'rgba(244, 63, 94, 0.25)' : 'rgba(15, 23, 42, 0.75)',
            border: `1px solid ${mascotMode ? '#F43F5E' : 'rgba(255, 255, 255, 0.15)'}`,
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
            background: isAudioEnabled ? 'rgba(16, 185, 129, 0.22)' : 'rgba(15, 23, 42, 0.75)',
            border: `1px solid ${isAudioEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}`,
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
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
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
          width: 280,
          zIndex: 20,
          color: '#E2E8F0',
          fontSize: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#38BDF8' }}>
            🎮 Kontrol Eksplorasi Tomat
          </div>
          <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
            <li><strong>W, A, S, D</strong> / Panah: Menjelajah lapangan & ruangan</li>
            <li><strong>SPASI</strong>: Melompat (Elastic Bounce)</li>
            <li><strong>SHIFT</strong>: Turbo Boost (Akselerasi cepat)</li>
            <li><strong>Q / E</strong>: 360° Acrobatic Aerial Spin</li>
            <li><strong>Tarik Mouse</strong>: Putar sudut pandang kamera</li>
            <li><strong>Scroll Mouse</strong>: Zoom In / Out</li>
          </ul>
        </div>
      )}

      {/* Tactile HUD Gamepad (Bottom Left) */}
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

        {/* Action Buttons: Boost, Jump, Spin */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            onMouseDown={() => triggerKeyAction('shift', true)}
            onMouseUp={() => triggerKeyAction('shift', false)}
            onTouchStart={() => triggerKeyAction('shift', true)}
            onTouchEnd={() => triggerKeyAction('shift', false)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: activeKeys['shift'] ? '#38BDF8' : 'rgba(56, 189, 248, 0.14)',
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

          <button
            onMouseDown={() => triggerKeyAction('space', true)}
            onMouseUp={() => triggerKeyAction('space', false)}
            onTouchStart={() => triggerKeyAction('space', true)}
            onTouchEnd={() => triggerKeyAction('space', false)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: activeKeys['space'] ? '#10B981' : 'rgba(16, 185, 129, 0.16)',
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

          <button
            onClick={() => triggerKeyAction('spin', true)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(244, 63, 94, 0.14)',
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
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
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
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.95)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)'}
        >
          <RotateCcw size={14} />
          <span>Reset Posisi</span>
        </button>
      </div>
    </div>
  );
};
