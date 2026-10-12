/**
 * BotanicalMeadow - Expansive Living Botanical Open-World (180m x 180m)
 * Features 5 distinct agricultural & natural zones:
 * 1. Central Laboratory & Greenhouse Pavilion
 * 2. Commercial Heirloom Trellis Rows (East Orchard)
 * 3. Wildflower Pollinator Meadow with Animated Butterflies (West Sanctuary)
 * 4. Irrigation Reservoir Lake with Water Lilies & Wooden Dock (South-West)
 * 5. Elevated Windmill Hill with Rotating Blades (South-East)
 * Plus outer pine tree forest perimeter, drifting cumulus clouds, and golden pollen spores.
 */
import * as THREE from 'three';

interface Butterfly {
  group: THREE.Group;
  wingLeft: THREE.Mesh;
  wingRight: THREE.Mesh;
  baseX: number;
  baseZ: number;
  baseY: number;
  radius: number;
  speed: number;
  phase: number;
}

export class BotanicalMeadow {
  private group: THREE.Group;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Animated elements
  private windmillBladesGroup: THREE.Group | null = null;
  private butterflies: Butterfly[] = [];
  private cloudsGroup: THREE.Group = new THREE.Group();
  private particlePoints!: THREE.Points;
  private particlePositions!: Float32Array;

  // Spatial boundaries (meters)
  public static readonly MEADOW_SIZE = 180; // 180x180m open world
  public static readonly BOUNDARY_RADIUS = 84.0;
  private static readonly PARTICLE_COUNT = 240;

  constructor() {
    this.group = new THREE.Group();

    this.buildExpansiveTerrain();
    this.buildIrrigationLake();
    this.buildWindmillHill();
    this.buildCommercialTrellisRows();
    this.buildWildflowerPollinatorSanctuary();
    this.buildGardenPathways();
    this.buildPerimeterForest();
    this.buildAnimatedButterflies();
    this.buildSkyClouds();
    this.buildAtmosphericParticles();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  /**
   * Evaluates exact procedural terrain elevation across the 180m open world.
   * Shared by physics, terrain mesh generation, and stone pathway conformality.
   */
  public static getTerrainHeight(x: number, z: number): number {
    // 1. Central greenhouse foundation depression to eliminate z-fighting with slab
    if (Math.abs(x) < 10.5 && Math.abs(z) < 8.5) {
      return -0.06;
    }

    // 2. South-West Irrigation Lake Basin excavation (x: -55 to -15, z: 15 to 55)
    const dxLake = (x - (-35)) / 22;
    const dzLake = (z - 35) / 22;
    const lakeDistSq = dxLake * dxLake + dzLake * dzLake;
    if (lakeDistSq < 1.0) {
      return (1.0 - Math.sqrt(lakeDistSq)) * -0.65;
    }

    // 3. South-East Windmill Hill mound elevation (x: 18 to 55, z: 20 to 60)
    const dxHill = (x - 38) / 20;
    const dzHill = (z - 40) / 20;
    const hillDistSq = dxHill * dxHill + dzHill * dzHill;
    if (hillDistSq < 1.0) {
      return (1.0 - Math.sqrt(hillDistSq)) * 4.5;
    }

    // 4. Perimeter Mountain Ridge around map edge (r > 68m)
    const distFromCenter = Math.hypot(x, z);
    if (distFromCenter > 68) {
      const outerRise = Math.pow((distFromCenter - 68) / 18, 2) * 6.5;
      const wave = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5;
      return outerRise + wave;
    }

    // 5. Gentle undulating agricultural terrain
    return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.35;
  }

  /**
   * Constructs procedurally contoured 180m terrain with lake basin and windmill hill
   */
  private buildExpansiveTerrain(): void {
    const segs = 64;
    const terrainGeo = new THREE.PlaneGeometry(BotanicalMeadow.MEADOW_SIZE, BotanicalMeadow.MEADOW_SIZE, segs, segs);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, BotanicalMeadow.getTerrainHeight(x, z));
    }

    terrainGeo.computeVertexNormals();
    this.disposables.push(terrainGeo);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2e8524, // Rich natural agricultural green
      roughness: 0.85,
      metalness: 0.02
    });
    this.disposables.push(grassMat);

    const terrainMesh = new THREE.Mesh(terrainGeo, grassMat);
    terrainMesh.receiveShadow = true;
    this.group.add(terrainMesh);
  }

  /**
   * Constructs South-West Irrigation Lake with water surface, lily pads, and wooden pier
   */
  private buildIrrigationLake(): void {
    const lakeGroup = new THREE.Group();
    lakeGroup.position.set(-35, 0, 35);

    // Reflective translucent water plane (y = -0.15)
    const waterGeo = new THREE.CircleGeometry(20, 32);
    waterGeo.rotateX(-Math.PI / 2);
    this.disposables.push(waterGeo);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d70b8,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.33,
      transparent: true,
      opacity: 0.85
    });
    this.disposables.push(waterMat);

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -0.15;
    lakeGroup.add(waterMesh);

    // Floating Lily Pads & Pink Lotus Flowers
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1c6b1a, roughness: 0.6 });
    const lotusMat = new THREE.MeshStandardMaterial({ color: 0xff66cc, roughness: 0.4 });
    this.disposables.push(padMat, lotusMat);

    const padPositions = [
      [-6, 4], [8, -5], [-3, -8], [7, 7], [-10, -2], [4, 9]
    ];

    padPositions.forEach(([px, pz]) => {
      const padGeo = new THREE.CircleGeometry(0.85, 12);
      padGeo.rotateX(-Math.PI / 2);
      this.disposables.push(padGeo);

      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, -0.13, pz);
      lakeGroup.add(pad);

      // Pink lotus flower
      const lotusGeo = new THREE.ConeGeometry(0.22, 0.35, 6);
      this.disposables.push(lotusGeo);
      const lotus = new THREE.Mesh(lotusGeo, lotusMat);
      lotus.position.set(px, 0.05, pz);
      lakeGroup.add(lotus);
    });

    // Wooden Observation Pier / Gazebo Dock extending into lake
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.8 });
    this.disposables.push(woodMat);

    // Deck planks (length 9m, width 3.2m, centered at z = -14)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 9.0), woodMat);
    deck.position.set(0, 0.1, -14);
    deck.castShadow = true;
    deck.receiveShadow = true;
    lakeGroup.add(deck);

    // Wooden Shoreline Access Ramp connecting dry terrain to pier deck
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 3.6), woodMat);
    ramp.position.set(0, 0.08, -19.5); // World pos: (-35, 0.08, 15.5)
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    lakeGroup.add(ramp);

    // Pier support posts
    [[-1.4, -17], [1.4, -17], [-1.4, -12], [1.4, -12], [-1.4, -10], [1.4, -10]].forEach(([postX, postZ]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), woodMat);
      post.position.set(postX, -0.4, postZ);
      post.castShadow = true;
      lakeGroup.add(post);
    });

    this.group.add(lakeGroup);
  }

  /**
   * Constructs South-East Windmill Hill with rotating sails
   */
  private buildWindmillHill(): void {
    const hillGroup = new THREE.Group();
    hillGroup.position.set(38, 4.4, 40);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8c8275, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.8 });
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xeee8d5, roughness: 0.6, side: THREE.DoubleSide });
    this.disposables.push(stoneMat, woodMat, sailMat);

    // Conical stone tower base (height 7.5m)
    const towerGeo = new THREE.CylinderGeometry(1.8, 2.6, 7.5, 12);
    this.disposables.push(towerGeo);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 3.75;
    tower.castShadow = true;
    tower.receiveShadow = true;
    hillGroup.add(tower);

    // Wooden dome / cap on top
    const capGeo = new THREE.ConeGeometry(2.1, 2.4, 12);
    this.disposables.push(capGeo);
    const cap = new THREE.Mesh(capGeo, woodMat);
    cap.position.y = 8.4;
    cap.castShadow = true;
    hillGroup.add(cap);

    // Central rotor axle hub
    this.windmillBladesGroup = new THREE.Group();
    this.windmillBladesGroup.position.set(0, 7.6, 1.9);

    const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 12), woodMat);
    hubMesh.rotation.x = Math.PI / 2;
    this.windmillBladesGroup.add(hubMesh);

    // 4 Lattice Sails (blades)
    const bladeArmGeo = new THREE.BoxGeometry(0.15, 6.4, 0.15);
    const sailCanvasGeo = new THREE.PlaneGeometry(1.1, 2.6);
    this.disposables.push(bladeArmGeo, sailCanvasGeo);

    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = angle;

      const spar = new THREE.Mesh(bladeArmGeo, woodMat);
      spar.position.y = 3.2;
      spar.castShadow = true;
      bladeArm.add(spar);

      const sailCloth = new THREE.Mesh(sailCanvasGeo, sailMat);
      sailCloth.position.set(0.6, 3.8, 0.05);
      sailCloth.castShadow = true;
      bladeArm.add(sailCloth);

      this.windmillBladesGroup.add(bladeArm);
    }

    hillGroup.add(this.windmillBladesGroup);
    this.group.add(hillGroup);
  }

  /**
   * Constructs Zone 2: Commercial Heirloom Trellis Rows (East Orchard)
   */
  private buildCommercialTrellisRows(): void {
    const trellisGroup = new THREE.Group();
    trellisGroup.position.set(35, 0, -32);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.85 });
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.3 });
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x22781b, roughness: 0.7 });
    const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xe01c1c, roughness: 0.3 });
    this.disposables.push(postMat, wireMat, vineMat, tomatoMat);

    // 6 parallel raised crop rows
    const rowSpacing = 4.2;
    const rowLength = 32.0;

    for (let r = -2; r <= 3; r++) {
      const zOffset = r * rowSpacing;

      // Wooden support posts at start, middle, and end
      [-rowLength / 2, 0, rowLength / 2].forEach(x => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), postMat);
        post.position.set(x, 1.3, zOffset);
        post.castShadow = true;
        trellisGroup.add(post);
      });

      // Horizontal trellis wire line
      const wire = new THREE.Mesh(new THREE.BoxGeometry(rowLength, 0.03, 0.03), wireMat);
      wire.position.set(0, 2.3, zOffset);
      trellisGroup.add(wire);

      // Lush climbing vines and hanging tomato clusters along the row
      const vineSegments = 8;
      for (let s = 0; s < vineSegments; s++) {
        const xPos = -rowLength / 2 + (s + 0.5) * (rowLength / vineSegments);

        // Foliage bundle
        const vineCluster = new THREE.Mesh(new THREE.SphereGeometry(0.65, 6, 6), vineMat);
        vineCluster.position.set(xPos, 1.4 + (s % 2) * 0.3, zOffset);
        vineCluster.scale.set(0.8, 1.6, 0.8);
        vineCluster.castShadow = true;
        trellisGroup.add(vineCluster);

        // Hanging tomato fruit clusters
        [[-0.2, 0.8], [0.2, 1.0], [0, 0.6]].forEach(([dx, dy]) => {
          const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), tomatoMat);
          tomato.position.set(xPos + dx, dy, zOffset + 0.35);
          trellisGroup.add(tomato);
        });
      }
    }

    this.group.add(trellisGroup);
  }

  /**
   * Constructs Zone 3: Wildflower Pollinator Meadow with vibrant flower patches
   */
  private buildWildflowerPollinatorSanctuary(): void {
    const sanctuaryGroup = new THREE.Group();
    sanctuaryGroup.position.set(-35, 0, -35);

    const lavenderMat = new THREE.MeshStandardMaterial({ color: 0x9370db, roughness: 0.6 });
    const sunflowerMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 });
    const daisyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    this.disposables.push(lavenderMat, sunflowerMat, daisyMat);

    // Lavender patches
    for (let i = 0; i < 40; i++) {
      const lx = (Math.random() - 0.5) * 34;
      const lz = (Math.random() - 0.5) * 34;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 4), lavenderMat);
      stalk.position.set(lx, 0.38, lz);
      sanctuaryGroup.add(stalk);
    }

    // Tall Sunflowers
    for (let j = 0; j < 18; j++) {
      const sx = (Math.random() - 0.5) * 32;
      const sz = (Math.random() - 0.5) * 32;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 5), lavenderMat);
      stem.position.set(sx, 0.9, sz);
      sanctuaryGroup.add(stem);

      const flowerHead = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), sunflowerMat);
      flowerHead.position.set(sx, 1.8, sz);
      flowerHead.rotation.x = -0.4;
      sanctuaryGroup.add(flowerHead);
    }

    this.group.add(sanctuaryGroup);
  }

  /**
   * Constructs stone pathways connecting all 5 zones with conformal terrain elevation
   */
  private buildGardenPathways(): void {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x948b7d,
      roughness: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    this.disposables.push(stoneMat);

    const stoneGeo = new THREE.CylinderGeometry(0.75, 0.82, 0.05, 8);
    this.disposables.push(stoneGeo);

    const createPath = (points: THREE.Vector3[], pointCount = 36) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(pointCount);

      curvePoints.forEach((pt, idx) => {
        const posX = pt.x + (idx % 2 === 0 ? 0.18 : -0.18);
        const posZ = pt.z;

        // Invariant: Do not place stone inside lake water (lake center: (-35, 35), radius: 20m)
        const distToLake = Math.hypot(posX - (-35), posZ - 35);
        if (distToLake < 20.2 && !(Math.abs(posX - (-35)) < 1.8 && posZ <= 15.2)) {
          return;
        }

        const groundY = BotanicalMeadow.getTerrainHeight(posX, posZ);
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.set(posX, groundY + 0.035, posZ);
        stone.rotation.y = idx * 0.72;
        stone.receiveShadow = true;
        this.group.add(stone);
      });
    };

    // Path 1: Greenhouse to Trellis Rows (North-East Orchard)
    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(12, 0, 2),
      new THREE.Vector3(24, 0, -14),
      new THREE.Vector3(35, 0, -28)
    ], 32);

    // Path 2: Greenhouse to Irrigation Lake Dock Ramp (South-West)
    // Seamlessly connects to the wooden shore ramp at (-35, 14.2) without entering water!
    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(-10, 0, 9.5),
      new THREE.Vector3(-22, 0, 11.5),
      new THREE.Vector3(-35, 0, 14.2)
    ], 30);

    // Path 3: Greenhouse to Windmill Hill (South-East)
    // Conforms cleanly to elevated hill slopes up to +4.2m
    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(14, 0, 16),
      new THREE.Vector3(26, 1.8, 28),
      new THREE.Vector3(36, 4.2, 38)
    ], 34);

    // Path 4: Greenhouse to Wildflower Sanctuary (North-West)
    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(-12, 0, -6),
      new THREE.Vector3(-24, 0, -18),
      new THREE.Vector3(-35, 0, -32)
    ], 32);

    // Path 5: Scenic Lakeside Shoreline Promenade
    // Follows the scenic dry grassy bank of the lake at r = 22.5m - 24m from lake center
    createPath([
      new THREE.Vector3(-35, 0, 13.5),
      new THREE.Vector3(-24, 0, 16.0),
      new THREE.Vector3(-14, 0, 26.0),
      new THREE.Vector3(-13, 0, 38.0),
      new THREE.Vector3(-17, 0, 49.0)
    ], 36);
  }

  /**
   * Constructs perimeter pine tree forest ring enclosing the 180m world
   */
  private buildPerimeterForest(): void {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3221, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x1b4d18, roughness: 0.75 });
    this.disposables.push(trunkMat, pineMat);

    const treeCount = 42;
    const radius = 78.0;

    for (let t = 0; t < treeCount; t++) {
      const angle = (t / treeCount) * Math.PI * 2;
      const tx = Math.cos(angle) * (radius + (t % 3) * 4);
      const tz = Math.sin(angle) * (radius + (t % 3) * 4);

      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.2, 7), trunkMat);
      trunk.position.y = 1.6;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // 3 Conical foliage tiers
      [
        { radius: 2.2, height: 3.2, y: 3.8 },
        { radius: 1.7, height: 2.8, y: 5.6 },
        { radius: 1.1, height: 2.2, y: 7.2 }
      ].forEach(tier => {
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(tier.radius, tier.height, 7), pineMat);
        foliage.position.y = tier.y;
        foliage.castShadow = true;
        treeGroup.add(foliage);
      });

      this.group.add(treeGroup);
    }
  }

  /**
   * Constructs 8 animated butterflies with dual flapping wings
   */
  private buildAnimatedButterflies(): void {
    const wingMatMonarch = new THREE.MeshBasicMaterial({ color: 0xff6b35, side: THREE.DoubleSide });
    const wingMatMorpho = new THREE.MeshBasicMaterial({ color: 0x00b4d8, side: THREE.DoubleSide });
    this.disposables.push(wingMatMonarch, wingMatMorpho);

    const wingGeo = new THREE.PlaneGeometry(0.22, 0.32);
    wingGeo.translate(0.11, 0, 0); // pivot at wing hinge
    this.disposables.push(wingGeo);

    for (let b = 0; b < 8; b++) {
      const bGroup = new THREE.Group();
      const mat = b % 2 === 0 ? wingMatMonarch : wingMatMorpho;

      const wingL = new THREE.Mesh(wingGeo, mat);
      const wingR = new THREE.Mesh(wingGeo, mat);
      wingR.rotation.y = Math.PI;

      bGroup.add(wingL);
      bGroup.add(wingR);

      // Distribute in flower sanctuary and greenhouse entrance
      const baseX = b < 5 ? -35 + (b - 2) * 6 : (b - 6) * 8;
      const baseZ = b < 5 ? -35 + (b - 2) * 6 : 10 + (b - 6) * 4;
      const baseY = 1.2 + (b % 3) * 0.4;

      bGroup.position.set(baseX, baseY, baseZ);
      this.group.add(bGroup);

      this.butterflies.push({
        group: bGroup,
        wingLeft: wingL,
        wingRight: wingR,
        baseX,
        baseZ,
        baseY,
        radius: 3.5 + (b % 3) * 1.5,
        speed: 1.2 + (b % 4) * 0.3,
        phase: b * 0.9
      });
    }
  }

  /**
   * Constructs fluffy low-poly cumulus clouds drifting in the sky
   */
  private buildSkyClouds(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.disposables.push(cloudMat);

    const cloudPuffs = 12;
    for (let c = 0; c < cloudPuffs; c++) {
      const cloud = new THREE.Group();
      const cx = (Math.random() - 0.5) * 160;
      const cy = 40 + Math.random() * 12;
      const cz = (Math.random() - 0.5) * 160;

      // 4-5 overlapping spheres per cloud
      for (let s = 0; s < 5; s++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(3.5 + Math.random() * 2.5, 6, 6),
          cloudMat
        );
        puff.position.set(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 6
        );
        cloud.add(puff);
      }

      cloud.position.set(cx, cy, cz);
      this.cloudsGroup.add(cloud);
    }

    this.group.add(this.cloudsGroup);
  }

  /**
   * Constructs atmospheric golden spore particle field
   */
  private buildAtmosphericParticles(): void {
    const geo = new THREE.BufferGeometry();
    const count = BotanicalMeadow.PARTICLE_COUNT;
    this.particlePositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      this.particlePositions[i * 3 + 1] = 0.5 + Math.random() * 8.0;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.disposables.push(geo);

    const mat = new THREE.PointsMaterial({
      color: 0xffe89e, // Shimmering golden pollen spores
      size: 0.16,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.disposables.push(mat);

    this.particlePoints = new THREE.Points(geo, mat);
    this.group.add(this.particlePoints);
  }

  /**
   * Frame animation update for windmill, butterflies, clouds, and particles
   */
  public update(deltaTime: number, elapsedTime: number): void {
    // 1. Rotate Windmill Sails
    if (this.windmillBladesGroup) {
      this.windmillBladesGroup.rotation.z += deltaTime * 0.9;
    }

    // 2. Animate Butterflies (Flight path + rapid wing flaps)
    this.butterflies.forEach(b => {
      const flightTime = elapsedTime * b.speed + b.phase;
      // Lissajous curve flight path
      const curX = b.baseX + Math.sin(flightTime) * b.radius;
      const curZ = b.baseZ + Math.cos(flightTime * 0.8) * b.radius;
      const curY = b.baseY + Math.sin(flightTime * 2.0) * 0.6;

      b.group.position.set(curX, curY, curZ);
      b.group.rotation.y = Math.atan2(Math.cos(flightTime), -Math.sin(flightTime * 0.8));

      // Flapping wings (rapid oscillation)
      const flapAngle = Math.sin(elapsedTime * 24.0 + b.phase) * 0.85;
      b.wingLeft.rotation.y = flapAngle;
      b.wingRight.rotation.y = Math.PI - flapAngle;
    });

    // 3. Slowly drift clouds along X axis
    this.cloudsGroup.children.forEach(cloud => {
      cloud.position.x += deltaTime * 0.8;
      if (cloud.position.x > 90) cloud.position.x = -90;
    });

    // 4. Update Spore Particles
    if (this.particlePoints) {
      const pos = this.particlePositions;
      const count = BotanicalMeadow.PARTICLE_COUNT;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 0] += Math.sin(pos[i * 3 + 1] * 0.4) * 0.3 * deltaTime;
        pos[i * 3 + 1] += Math.cos(pos[i * 3 + 0] * 0.4) * 0.2 * deltaTime;

        if (pos[i * 3 + 1] > 8.0) pos[i * 3 + 1] = 0.5;
        if (pos[i * 3 + 1] < 0.3) pos[i * 3 + 1] = 7.8;
      }
      this.particlePoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.butterflies = [];
  }
}
