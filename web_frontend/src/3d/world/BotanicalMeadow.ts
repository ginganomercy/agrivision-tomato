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

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1d70b8,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82
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
   * Constructs South-East Dutch Heritage Windmill Hill
   * Features:
   * 1. Deep Sub-Surface Masonry Foundation Plinth (anchored 2.8m deep into hill slopes, 0% floating)
   * 2. Stepped Flagstone Terrace & Arrival Steps connecting directly from stone pathway
   * 3. Rustic Wooden Railing with cross-bracing
   * 4. Octagonal Tapered Stone Masonry Lower Tower with Arched Timber Door & Wall Lantern
   * 5. Mid-Tower Observation Balcony / Catwalk Gallery with wooden corbels & railing
   * 6. Upper Cedar Weatherboard Timber Body with framed glass windows
   * 7. Conical Cedar Cap Roof with ornamental finial spire & rear auxiliary fantail
   * 8. Player-Facing High-Detail 4-Blade Lattice Sails with timber spars, lattice ribs & canvas cloths
   */
  private buildWindmillHill(): void {
    const hillGroup = new THREE.Group();
    // Anchor hillGroup at y = 0 world coordinates for deterministic, rock-solid grounding
    hillGroup.position.set(38, 0, 40);

    // Architectural Material Palette
    const subStoneMat = new THREE.MeshStandardMaterial({ color: 0x48423a, roughness: 0.95 });
    const terraceStoneMat = new THREE.MeshStandardMaterial({ color: 0x7c7366, roughness: 0.88 });
    const towerStoneMat = new THREE.MeshStandardMaterial({ color: 0x8f8476, roughness: 0.85 });
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x3d2616, roughness: 0.8 });
    const timberCedarMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.75 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xede8d0, roughness: 0.6 });
    const windowGlassMat = new THREE.MeshStandardMaterial({ color: 0x90caf9, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.75 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const sailClothMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e1, roughness: 0.6, side: THREE.DoubleSide });
    const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffa000, emissiveIntensity: 0.8 });

    this.disposables.push(
      subStoneMat, terraceStoneMat, towerStoneMat, timberDarkMat,
      timberCedarMat, trimMat, windowGlassMat, ironMat, sailClothMat, lanternGlowMat
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. DEEP SUB-SURFACE FOUNDATION PLINTH (Anchored from y = 1.0m to 4.2m)
    // At hill radius 4.5m, terrain surface is y = 3.48m. Base at y = 1.0m sinks 2.48m deep!
    // ─────────────────────────────────────────────────────────────────────────────
    const subPlinthGeo = new THREE.CylinderGeometry(4.5, 4.8, 3.2, 16);
    this.disposables.push(subPlinthGeo);
    const subPlinth = new THREE.Mesh(subPlinthGeo, subStoneMat);
    subPlinth.position.y = 2.4; // Spans y: 0.8m to 4.0m
    subPlinth.receiveShadow = true;
    hillGroup.add(subPlinth);

    // Terrace Upper Plinth & Curb (Spans y: 3.9m to 4.7m)
    const terracePlinthGeo = new THREE.CylinderGeometry(3.9, 4.3, 0.8, 16);
    this.disposables.push(terracePlinthGeo);
    const terracePlinth = new THREE.Mesh(terracePlinthGeo, terraceStoneMat);
    terracePlinth.position.y = 4.3;
    terracePlinth.receiveShadow = true;
    hillGroup.add(terracePlinth);

    // Flagstone Terrace Floor Slab (top at y = 4.72m)
    const terraceFloorGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.12, 16);
    this.disposables.push(terraceFloorGeo);
    const terraceFloor = new THREE.Mesh(terraceFloorGeo, terraceStoneMat);
    terraceFloor.position.y = 4.72;
    terraceFloor.receiveShadow = true;
    hillGroup.add(terraceFloor);

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. ARRIVAL STEPS & TERRACE PERIMETER RAILING (Connecting from Path 3)
    // Incoming path vector is towards North-West (yaw = -135° = -2.356 rad)
    // ─────────────────────────────────────────────────────────────────────────────
    const arrivalAngle = -Math.PI * 0.75; // Direction facing incoming player path
    const arrivalGroup = new THREE.Group();
    arrivalGroup.rotation.y = arrivalAngle;

    // 3 Curved Stone Arrival Steps descending from y = 4.7m down to 4.0m
    [
      { width: 2.2, height: 0.22, depth: 1.0, y: 4.56, z: 3.9 },
      { width: 2.5, height: 0.22, depth: 1.0, y: 4.34, z: 4.7 },
      { width: 2.8, height: 0.22, depth: 1.1, y: 4.12, z: 5.5 }
    ].forEach(st => {
      const stepGeo = new THREE.BoxGeometry(st.width, st.height, st.depth);
      this.disposables.push(stepGeo);
      const step = new THREE.Mesh(stepGeo, terraceStoneMat);
      step.position.set(0, st.y, st.z);
      step.receiveShadow = true;
      arrivalGroup.add(step);
    });
    hillGroup.add(arrivalGroup);

    // Terrace Perimeter Wooden Railing (Leaving 2.6m opening for arrival steps)
    const railPostCount = 12;
    const railRadius = 3.65;
    for (let r = 0; r < railPostCount; r++) {
      const pAngle = (r / railPostCount) * Math.PI * 2;
      // Skip posts across the doorway / arrival stairs sector (near arrivalAngle)
      let diffAngle = Math.abs(pAngle - (arrivalAngle + Math.PI * 2) % (Math.PI * 2));
      if (diffAngle > Math.PI) diffAngle = Math.PI * 2 - diffAngle;
      if (diffAngle < 0.45) continue;

      const px = Math.cos(pAngle) * railRadius;
      const pz = Math.sin(pAngle) * railRadius;

      // Wooden Post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), timberDarkMat);
      post.position.set(px, 5.15, pz);
      post.castShadow = true;
      hillGroup.add(post);
    }

    // Circular Top Rail Ring
    const railRingGeo = new THREE.TorusGeometry(railRadius, 0.045, 6, 24);
    this.disposables.push(railRingGeo);
    const railRing = new THREE.Mesh(railRingGeo, timberDarkMat);
    railRing.rotation.x = Math.PI / 2;
    railRing.position.y = 5.5;
    hillGroup.add(railRing);

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. OCTAGONAL LOWER STONE TOWER (Spans y: 4.7m to 9.8m)
    // ─────────────────────────────────────────────────────────────────────────────
    const towerGeo = new THREE.CylinderGeometry(2.3, 2.9, 5.1, 8);
    this.disposables.push(towerGeo);
    const tower = new THREE.Mesh(towerGeo, towerStoneMat);
    tower.position.y = 7.25;
    tower.castShadow = true;
    tower.receiveShadow = true;
    hillGroup.add(tower);

    // Arched Timber Entrance Doorway (Facing North-West towards player path)
    const doorGroup = new THREE.Group();
    doorGroup.rotation.y = arrivalAngle;

    // Door Frame
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 0.28), timberDarkMat);
    doorFrame.position.set(0, 5.85, 2.65);
    doorGroup.add(doorFrame);

    // Wooden Door Panel
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.1, 0.16), timberCedarMat);
    doorPanel.position.set(0, 5.85, 2.73);
    doorGroup.add(doorPanel);

    // Iron Door Handle & Cross-brace
    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), ironMat);
    doorKnob.position.set(0.38, 5.85, 2.82);
    doorGroup.add(doorKnob);

    // Wall Lantern next to doorway
    const lanternBracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.35), ironMat);
    lanternBracket.position.set(0.85, 6.25, 2.65);
    doorGroup.add(lanternBracket);

    const lanternCage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), ironMat);
    lanternCage.position.set(0.85, 6.15, 2.9);
    doorGroup.add(lanternCage);

    const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lanternGlowMat);
    lanternBulb.position.set(0.85, 6.15, 2.9);
    doorGroup.add(lanternBulb);

    hillGroup.add(doorGroup);

    // Mid-tower Windows (East and West sides for scenic daylight reflection)
    [-Math.PI / 2, Math.PI / 2].forEach(wRot => {
      const winGroup = new THREE.Group();
      winGroup.rotation.y = wRot;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.25, 0.2), trimMat);
      frame.position.set(0, 8.2, 2.45);
      winGroup.add(frame);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 1.05), windowGlassMat);
      glass.position.set(0, 8.2, 2.56);
      winGroup.add(glass);

      hillGroup.add(winGroup);
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. MID-TOWER CATWALK GALLERY (Observation Balcony at y = 9.8m)
    // ─────────────────────────────────────────────────────────────────────────────
    const galleryDeckGeo = new THREE.CylinderGeometry(3.1, 3.1, 0.16, 16);
    this.disposables.push(galleryDeckGeo);
    const galleryDeck = new THREE.Mesh(galleryDeckGeo, timberDarkMat);
    galleryDeck.position.y = 9.8;
    galleryDeck.castShadow = true;
    hillGroup.add(galleryDeck);

    // Cantilevered Timber Corbel Brackets underneath balcony
    for (let c = 0; c < 8; c++) {
      const cAngle = (c / 8) * Math.PI * 2;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.75), timberDarkMat);
      bracket.position.set(Math.cos(cAngle) * 2.5, 9.42, Math.sin(cAngle) * 2.5);
      bracket.rotation.y = cAngle;
      hillGroup.add(bracket);
    }

    // Gallery Balcony Perimeter Railing
    const balcPostCount = 12;
    for (let bp = 0; bp < balcPostCount; bp++) {
      const bpAngle = (bp / balcPostCount) * Math.PI * 2;
      const bPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), timberDarkMat);
      bPost.position.set(Math.cos(bpAngle) * 2.95, 10.3, Math.sin(bpAngle) * 2.95);
      hillGroup.add(bPost);
    }

    const balcRingGeo = new THREE.TorusGeometry(2.95, 0.04, 6, 20);
    this.disposables.push(balcRingGeo);
    const balcRing = new THREE.Mesh(balcRingGeo, timberDarkMat);
    balcRing.rotation.x = Math.PI / 2;
    balcRing.position.y = 10.7;
    hillGroup.add(balcRing);

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. UPPER TIMBER TOWER BODY (Spans y: 9.8m to 12.8m)
    // ─────────────────────────────────────────────────────────────────────────────
    const upperTowerGeo = new THREE.CylinderGeometry(1.7, 2.15, 3.0, 8);
    this.disposables.push(upperTowerGeo);
    const upperTower = new THREE.Mesh(upperTowerGeo, timberCedarMat);
    upperTower.position.y = 11.3;
    upperTower.castShadow = true;
    hillGroup.add(upperTower);

    // Decorative White Trim Ring between upper tower and cap roof
    const trimRing = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.16, 12), trimMat);
    trimRing.position.y = 12.85;
    hillGroup.add(trimRing);

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. ROTATING CAP ROOF & PLAYER-FACING LATTICE SAILS
    // Cap is oriented along arrivalAngle (-135°) so sails FACE the arriving player!
    // ─────────────────────────────────────────────────────────────────────────────
    const capAssembly = new THREE.Group();
    capAssembly.position.y = 12.9;
    capAssembly.rotation.y = arrivalAngle;

    // Cedar Conical Cap Roof
    const capRoofGeo = new THREE.ConeGeometry(2.15, 2.5, 8);
    this.disposables.push(capRoofGeo);
    const capRoof = new THREE.Mesh(capRoofGeo, timberDarkMat);
    capRoof.position.y = 1.25;
    capRoof.castShadow = true;
    capAssembly.add(capRoof);

    // Ornamental Finial Spire
    const spireGeo = new THREE.CylinderGeometry(0.05, 0.16, 1.3, 6);
    this.disposables.push(spireGeo);
    const spire = new THREE.Mesh(spireGeo, trimMat);
    spire.position.y = 2.9;
    capAssembly.add(spire);

    // Rear Auxiliary Fantail (Wind Vane at back of cap)
    const fantailPole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), timberDarkMat);
    fantailPole.position.set(0, 0.9, -1.9);
    capAssembly.add(fantailPole);

    const fantailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 8), ironMat);
    fantailHub.position.set(0, 0.9, -2.6);
    fantailHub.rotation.x = Math.PI / 2;
    capAssembly.add(fantailHub);

    for (let f = 0; f < 6; f++) {
      const fAngle = (f / 6) * Math.PI * 2;
      const fBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.02), trimMat);
      fBlade.position.set(Math.sin(fAngle) * 0.35, 0.9 + Math.cos(fAngle) * 0.35, -2.6);
      fBlade.rotation.z = -fAngle;
      capAssembly.add(fBlade);
    }

    // Cast-iron Forward Rotor Axle Housing (Menjorok ke depan ke arah pemain)
    const axleHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.9, 12), ironMat);
    axleHousing.rotation.x = Math.PI / 2;
    axleHousing.position.set(0, 0.85, 1.55);
    capAssembly.add(axleHousing);

    // Rotor Axle Hub (Dynamic Rotating Group)
    this.windmillBladesGroup = new THREE.Group();
    this.windmillBladesGroup.position.set(0, 0.85, 2.0);

    const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12), ironMat);
    hubMesh.rotation.x = Math.PI / 2;
    this.windmillBladesGroup.add(hubMesh);

    // 4 High-Detail Lattice Sails (12.4m Total Wingspan)
    const bladeArmGeo = new THREE.BoxGeometry(0.16, 6.2, 0.16);
    const sailCanvasGeo = new THREE.PlaneGeometry(1.25, 3.4);
    this.disposables.push(bladeArmGeo, sailCanvasGeo);

    for (let b = 0; b < 4; b++) {
      const bAngle = (b * Math.PI) / 2;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = bAngle;

      // Heavy timber main spar
      const spar = new THREE.Mesh(bladeArmGeo, timberCedarMat);
      spar.position.y = 3.1;
      spar.castShadow = true;
      bladeArm.add(spar);

      // 5 Horizontal Timber Lattice Ribs
      for (let rib = 0; rib < 5; rib++) {
        const ribY = 1.8 + rib * 0.85;
        const ribMesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.06), timberDarkMat);
        ribMesh.position.set(0.65, ribY, 0.02);
        ribMesh.castShadow = true;
        bladeArm.add(ribMesh);
      }

      // Elegantly Tailored Cream Canvas Sail Cloth
      const sailCloth = new THREE.Mesh(sailCanvasGeo, sailClothMat);
      sailCloth.position.set(0.68, 3.5, 0.06);
      sailCloth.castShadow = true;
      bladeArm.add(sailCloth);

      this.windmillBladesGroup.add(bladeArm);
    }

    capAssembly.add(this.windmillBladesGroup);
    hillGroup.add(capAssembly);

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

      // Wooden support posts at start, middle, and end (height 3.2m, sinks 0.35m into ground)
      [-rowLength / 2, 0, rowLength / 2].forEach(x => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 0.16), postMat);
        post.position.set(x, 1.25, zOffset);
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

    // Path 3: Greenhouse to Windmill Hill Terrace Steps (South-East)
    // Connects seamlessly to the Dutch Windmill stone arrival steps at (34.2, 36.2)
    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(14, 0, 16),
      new THREE.Vector3(25, 1.8, 27),
      new THREE.Vector3(34.2, 4.1, 36.2)
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

      // Conformal grounding: Anchor tree group directly to procedural perimeter ridge elevation
      const treeGroundY = BotanicalMeadow.getTerrainHeight(tx, tz);
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, treeGroundY - 0.25, tz);

      // Deeply anchored trunk (height 3.6m, sinks 0.3m into ground)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.6, 7), trunkMat);
      trunk.position.y = 1.8;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // 3 Conical foliage tiers
      [
        { radius: 2.2, height: 3.2, y: 3.9 },
        { radius: 1.7, height: 2.8, y: 5.7 },
        { radius: 1.1, height: 2.2, y: 7.3 }
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

      // Distribute all 8 butterflies across Zone 3: Wildflower Sanctuary (-35, -35)
      const angle = (b / 8) * Math.PI * 2;
      const dist = 5.0 + (b % 4) * 3.5;
      const baseX = -35 + Math.cos(angle) * dist;
      const baseZ = -35 + Math.sin(angle) * dist;
      const baseY = 1.3 + (b % 3) * 0.35;

      bGroup.position.set(baseX, baseY, baseZ);
      this.group.add(bGroup);

      this.butterflies.push({
        group: bGroup,
        wingLeft: wingL,
        wingRight: wingR,
        baseX,
        baseZ,
        baseY,
        radius: 2.8 + (b % 3) * 1.2,
        speed: 1.1 + (b % 4) * 0.25,
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
