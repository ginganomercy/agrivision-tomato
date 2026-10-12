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
    this.buildGuildTavern();
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
   * Computes exact solid surface elevation including elevated architectural structures:
   * 1. Windmill Hill Terrace & Stepped Arrival Stairs (y = 4.12m to 4.78m)
   * 2. Agri-Guild Tavern Foundation, Porch Deck & Steps (y = 0.28m to 0.54m)
   * 3. Lake Observation Pier Deck & Sloped Shore Ramp (y = 0.08m to 0.18m)
   * 4. Base natural terrain elevation (falls back to getTerrainHeight)
   * Solves character sinking/clipping into stone floors and stairs.
   */
  public static getSurfaceElevation(x: number, z: number): number {
    // 1. Windmill Hill Terrace & Arrival Steps (Center: x=38, z=40)
    const distToWindmill = Math.hypot(x - 38, z - 40);
    if (distToWindmill <= 4.45) {
      const dx = x - 38;
      const dz = z - 40;
      // Local coordinates in arrivalGroup (rotated by -3*PI/4)
      const angle = -Math.PI * 0.75;
      const localX = dx * Math.cos(angle) - dz * Math.sin(angle);
      const localZ = dx * Math.sin(angle) + dz * Math.cos(angle);

      // Check 3 stepped arrival stone stairs
      if (Math.abs(localX) <= 1.6) {
        if (localZ >= 5.0 && localZ <= 6.3) return 4.23; // Step 3
        if (localZ >= 4.2 && localZ < 5.0) return 4.45;  // Step 2
        if (localZ >= 3.4 && localZ < 4.2) return 4.67;  // Step 1
      }

      // Circular Flagstone Terrace Floor
      if (distToWindmill <= 4.15) {
        return 4.78; // Terrace floor top surface
      }
    }

    // 2. Agri-Guild Tavern & Sheltered Porch (Center: x=-14, z=18)
    // Tavern Hall: x in [-19.5, -8.5], z in [13.5, 22.0] -> floor at y = 0.54
    // Tavern Porch: x in [-19.5, -8.5], z in [22.0, 25.5] -> floor at y = 0.50
    // Porch Steps: x in [-16.0, -12.0], z in [25.5, 26.8] -> step at y = 0.28
    if (x >= -20.0 && x <= -8.0 && z >= 13.0 && z <= 27.0) {
      if (z >= 13.5 && z <= 22.0) return 0.54; // Inside Tavern Hall
      if (z > 22.0 && z <= 25.5) return 0.50;  // Front Porch Deck
      if (z > 25.5 && z <= 26.8 && Math.abs(x - (-14)) <= 2.2) return 0.28; // Porch Step
    }

    // 3. Grand Botanical Lake Arch Bridge & Central Lotus Gazebo (Center: x=-35, z=35)
    // Full span extends from North shore (z=13.5) across Central Gazebo (z=35) to South shore (z=56.5)
    const distToLakeCenter = Math.hypot(x - (-35), z - 35);
    // Central Lotus Gazebo Island (radius <= 4.5m)
    if (distToLakeCenter <= 4.5) {
      return 0.45; // Solid wooden gazebo deck
    }

    // Bridge Walkway Spans: Width 3.8m (Math.abs(x - (-35)) <= 2.05)
    if (Math.abs(x - (-35)) <= 2.05 && z >= 13.5 && z <= 56.5) {
      // North Shore Approach Ramp (z: 13.5 to 17.0)
      if (z < 17.0) {
        const rampNorm = (z - 13.5) / 3.5;
        return 0.08 + rampNorm * 0.20;
      }
      // North Arched Bridge Span (z: 17.0 to 30.5)
      if (z <= 30.5) {
        const u = (z - 17.0) / 13.5;
        return 0.28 + (0.45 - 0.28) * u + Math.sin(u * Math.PI) * 0.22;
      }
      // South Arched Bridge Span (z: 39.5 to 53.0)
      if (z >= 39.5 && z <= 53.0) {
        const v = (z - 39.5) / 13.5;
        return 0.45 - (0.45 - 0.28) * v + Math.sin(v * Math.PI) * 0.22;
      }
      // South Shore Approach Ramp (z: 53.0 to 56.5)
      if (z > 53.0) {
        const w = (z - 53.0) / 3.5;
        return 0.28 - w * 0.20;
      }
      // Central bridge connection to gazebo
      return 0.45;
    }

    // Default to natural procedural terrain elevation
    return BotanicalMeadow.getTerrainHeight(x, z);
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
   * Constructs South-West Irrigation Lake with water surface, blooming lotus pads,
   * Grand Full-Span Botanical Arch Bridge, and Central Lotus Gazebo Pavilion.
   * Features:
   * 1. 40m circular reflective irrigation lake basin with floating lily pads and pink lotuses.
   * 2. Full-span arched wooden footbridge spanning from North shore (z=14) across to South shore (z=56).
   * 3. Central Lotus Gazebo Pavilion (8-pillared octagonal gazebo with conical cedar roof, spire finial, hanging lantern & benches).
   * 4. Heavy timber side handrails with vertical balusters and warm entrance lantern posts.
   * 5. Solid underwater stone plinths and timber pilings anchored into lake bed (0% floating).
   */
  private buildIrrigationLake(): void {
    const lakeGroup = new THREE.Group();
    lakeGroup.position.set(-35, 0, 35);

    // 1. Reflective translucent water plane (y = -0.15)
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

    // 2. Floating Lily Pads & Pink Lotus Flowers around the lake
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1c6b1a, roughness: 0.6 });
    const lotusMat = new THREE.MeshStandardMaterial({ color: 0xff66cc, roughness: 0.4 });
    this.disposables.push(padMat, lotusMat);

    const padPositions = [
      [-7, -10], [9, -11], [-11, -3], [12, -4],
      [-9, 8], [11, 7], [-8, 14], [8, 13],
      [-13, 2], [14, 1], [-5, -15], [6, 16]
    ];

    padPositions.forEach(([px, pz]) => {
      const padGeo = new THREE.CircleGeometry(0.9, 12);
      padGeo.rotateX(-Math.PI / 2);
      this.disposables.push(padGeo);

      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, -0.13, pz);
      lakeGroup.add(pad);

      const lotusGeo = new THREE.ConeGeometry(0.24, 0.38, 6);
      this.disposables.push(lotusGeo);
      const lotus = new THREE.Mesh(lotusGeo, lotusMat);
      lotus.position.set(px, 0.06, pz);
      lakeGroup.add(lotus);
    });

    // 3. Shared Architectural Materials
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x482d1c, roughness: 0.85 });
    const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.78 });
    const stonePlinthMat = new THREE.MeshStandardMaterial({ color: 0x54524e, roughness: 0.9 });
    const cedarRoofMat = new THREE.MeshStandardMaterial({ color: 0x7a3a22, roughness: 0.75 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb58900, metalness: 0.8, roughness: 0.3 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffaa00,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    this.disposables.push(timberDarkMat, woodDeckMat, stonePlinthMat, cedarRoofMat, brassMat, lanternGlowMat);

    // 4. Central Lotus Gazebo Island (at center x=0, z=0)
    // Deep underwater stone foundation plinth (y=-0.7 to y=0.35)
    const plinthGeo = new THREE.CylinderGeometry(4.6, 4.9, 1.1, 8);
    this.disposables.push(plinthGeo);
    const plinth = new THREE.Mesh(plinthGeo, stonePlinthMat);
    plinth.position.y = -0.15;
    plinth.receiveShadow = true;
    lakeGroup.add(plinth);

    // Octagonal wooden gazebo floor deck (y=0.45)
    const gazeboDeckGeo = new THREE.CylinderGeometry(4.4, 4.4, 0.18, 8);
    this.disposables.push(gazeboDeckGeo);
    const gazeboDeck = new THREE.Mesh(gazeboDeckGeo, woodDeckMat);
    gazeboDeck.position.y = 0.45;
    gazeboDeck.receiveShadow = true;
    lakeGroup.add(gazeboDeck);

    // 8 Carved Wooden Columns supporting roof
    const columnGeo = new THREE.BoxGeometry(0.24, 3.0, 0.24);
    this.disposables.push(columnGeo);
    for (let c = 0; c < 8; c++) {
      const colAngle = (c * Math.PI) / 4;
      const colX = Math.cos(colAngle) * 3.85;
      const colZ = Math.sin(colAngle) * 3.85;

      const column = new THREE.Mesh(columnGeo, timberDarkMat);
      column.position.set(colX, 1.95, colZ);
      column.castShadow = true;
      lakeGroup.add(column);
    }

    // Gazebo Octagonal Conical Cedar Roof
    const roofGeo = new THREE.ConeGeometry(5.1, 2.5, 8);
    this.disposables.push(roofGeo);
    const roof = new THREE.Mesh(roofGeo, cedarRoofMat);
    roof.position.y = 4.65;
    roof.castShadow = true;
    lakeGroup.add(roof);

    // Roof Spire Finial
    const finialGeo = new THREE.ConeGeometry(0.18, 0.9, 6);
    this.disposables.push(finialGeo);
    const finial = new THREE.Mesh(finialGeo, brassMat);
    finial.position.y = 6.35;
    lakeGroup.add(finial);

    // Central Brass Hanging Chandelier Lantern
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4), brassMat);
    chain.position.set(0, 3.6, 0);
    lakeGroup.add(chain);

    const chandelier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), lanternGlowMat);
    chandelier.position.set(0, 3.0, 0);
    lakeGroup.add(chandelier);

    // Gazebo Observation Benches (East & West sides facing lotus flowers)
    [-2.7, 2.7].forEach(bx => {
      const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2.4), woodDeckMat);
      benchSeat.position.set(bx, 0.82, 0);
      benchSeat.castShadow = true;
      lakeGroup.add(benchSeat);

      const benchBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 2.4), woodDeckMat);
      benchBack.position.set(bx > 0 ? bx + 0.22 : bx - 0.22, 1.05, 0);
      lakeGroup.add(benchBack);
    });

    // Perimeter Railing on Gazebo with North & South bridge access portals
    for (let r = 0; r < 8; r++) {
      // Skip North (r=6 -> angle 3PI/2) and South (r=2 -> angle PI/2) openings
      if (r === 2 || r === 6) continue;
      const midAngle = (r + 0.5) * (Math.PI / 4);
      const rx = Math.cos(midAngle) * 3.85;
      const rz = Math.sin(midAngle) * 3.85;

      const railSegment = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 0.12), timberDarkMat);
      railSegment.position.set(rx, 1.25, rz);
      railSegment.rotation.y = -midAngle + Math.PI / 2;
      railSegment.castShadow = true;
      lakeGroup.add(railSegment);
    }

    // 5. Arched Wooden Bridge Spans (North: z=-18 to -4.5, South: z=+4.5 to +18)
    const createBridgeSpan = (isNorth: boolean) => {
      const zStart = isNorth ? -18.0 : 4.5;
      const spanLength = 13.5;
      const segments = 7;
      const segLength = spanLength / segments;

      // Segmented Arched Walkway Deck
      for (let s = 0; s < segments; s++) {
        const segZ = zStart + (s + 0.5) * segLength;
        const norm = isNorth ? (segZ - (-18.0)) / spanLength : (segZ - 4.5) / spanLength;
        const baseSlope = isNorth ? 0.28 + (0.45 - 0.28) * norm : 0.45 - (0.45 - 0.28) * norm;
        const archY = baseSlope + Math.sin(norm * Math.PI) * 0.22;

        const deckSeg = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, segLength + 0.1), woodDeckMat);
        deckSeg.position.set(0, archY, segZ);
        deckSeg.castShadow = true;
        deckSeg.receiveShadow = true;
        lakeGroup.add(deckSeg);
      }

      // Continuous Safety Handrails (West: x=-1.75, East: x=+1.75)
      [-1.75, 1.75].forEach(rx => {
        // Continuous top rail
        const railZ = isNorth ? -11.25 : 11.25;
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, spanLength), timberDarkMat);
        topRail.position.set(rx, 1.28, railZ);
        topRail.castShadow = true;
        lakeGroup.add(topRail);

        const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, spanLength), timberDarkMat);
        midRail.position.set(rx, 0.88, railZ);
        midRail.castShadow = true;
        lakeGroup.add(midRail);

        // Vertical Balusters spaced every 2.25m
        for (let b = 0; b <= 6; b++) {
          const bz = zStart + b * 2.25;
          const bNorm = isNorth ? (bz - (-18.0)) / spanLength : (bz - 4.5) / spanLength;
          const bBase = isNorth ? 0.28 + (0.45 - 0.28) * bNorm : 0.45 - (0.45 - 0.28) * bNorm;
          const bArchY = bBase + Math.sin(bNorm * Math.PI) * 0.22;

          const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), timberDarkMat);
          baluster.position.set(rx, bArchY + 0.55, bz);
          baluster.castShadow = true;
          lakeGroup.add(baluster);
        }
      });

      // Submerged Timber Pilings into Lake Bed
      [-9.0, -15.0].forEach(pzRel => {
        const pz = isNorth ? pzRel : -pzRel;
        [-1.6, 1.6].forEach(px => {
          const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.8, 8), timberDarkMat);
          piling.position.set(px, -0.4, pz);
          piling.castShadow = true;
          lakeGroup.add(piling);
        });

        // Horizontal cross tie
        const crossTie = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.18), timberDarkMat);
        crossTie.position.set(0, 0.1, pz);
        lakeGroup.add(crossTie);
      });

      // Entrance Brass Lanterns on corner posts
      const entranceZ = isNorth ? -18.0 : 18.0;
      [-1.75, 1.75].forEach(lx => {
        const lanternPost = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), timberDarkMat);
        lanternPost.position.set(lx, 0.98, entranceZ);
        lakeGroup.add(lanternPost);

        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 0.22), lanternGlowMat);
        lantern.position.set(lx, 1.78, entranceZ);
        lakeGroup.add(lantern);
      });
    };

    createBridgeSpan(true);  // North Span
    createBridgeSpan(false); // South Span

    // 6. Shoreline Approach Ramps (North: z=-21.5 to -18.0, South: z=+18.0 to +21.5)
    // North Approach Ramp (Slopes from 0.08m at shore z=-21.5 to 0.28m at bridge start z=-18.0)
    const northRamp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 3.6), woodDeckMat);
    northRamp.position.set(0, 0.18, -19.75);
    northRamp.rotation.x = -0.057; // Smooth slope up to bridge deck
    northRamp.castShadow = true;
    northRamp.receiveShadow = true;
    lakeGroup.add(northRamp);

    // South Approach Ramp (Slopes from 0.28m at bridge end z=+18.0 to 0.08m at shore z=+21.5)
    const southRamp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 3.6), woodDeckMat);
    southRamp.position.set(0, 0.18, 19.75);
    southRamp.rotation.x = 0.057; // Smooth slope down to shore
    southRamp.castShadow = true;
    southRamp.receiveShadow = true;
    lakeGroup.add(southRamp);

    this.group.add(lakeGroup);
  }

  /**
   * Constructs South-West Agri-Guild Tavern & Bounty Hall (Center: x=-14, z=18)
   * Features:
   * 1. Deep Sub-Surface Stone Foundation Plinth (anchored 1.2m deep into ground)
   * 2. Traditional Half-Timbered Medieval/Pastoral Tavern Architecture (cream plaster & dark oak timbers)
   * 3. Cedar Shingle Double-Pitch Gable Roof with stone chimney & smoke puffs
   * 4. Sheltered Front Porch with carved posts, cider barrels, picnic bench & hanging lanterns
   * 5. Carved hanging wooden sign: "AGRI-GUILD TAVERN"
   * 6. Interactive Bounty Notice Board for pest monster quests
   */
  private buildGuildTavern(): void {
    const tavernGroup = new THREE.Group();
    // Located in scenic South-West meadow: x = -14, z = 18
    tavernGroup.position.set(-14, 0, 18);

    // Tavern Material Palette
    const stonePlinthMat = new THREE.MeshStandardMaterial({ color: 0x484239, roughness: 0.95 });
    const plasterWallMat = new THREE.MeshStandardMaterial({ color: 0xe8dfce, roughness: 0.85 });
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a2213, roughness: 0.8 });
    const cedarRoofMat = new THREE.MeshStandardMaterial({ color: 0x5a341b, roughness: 0.75 });
    const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x6e4727, roughness: 0.8 });
    const warmGlassMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.2, metalness: 0.3, emissive: 0xff9800, emissiveIntensity: 0.4 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const barrelWoodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.7 });
    const parchmentMat = new THREE.MeshStandardMaterial({ color: 0xf5eed9, roughness: 0.9 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 0.9 });

    this.disposables.push(
      stonePlinthMat, plasterWallMat, timberDarkMat, cedarRoofMat, woodDeckMat,
      warmGlassMat, ironMat, barrelWoodMat, parchmentMat, lanternGlowMat
    );

    // 1. Deep Sub-Surface Foundation Plinth (width 11.5m, depth 13.5m, sinks 1.2m deep into ground)
    const plinthGeo = new THREE.BoxGeometry(11.5, 1.8, 13.5);
    this.disposables.push(plinthGeo);
    const plinth = new THREE.Mesh(plinthGeo, stonePlinthMat);
    plinth.position.set(0, -0.36, 1.8); // Top surface at y = 0.54
    plinth.receiveShadow = true;
    tavernGroup.add(plinth);

    // 2. Main Tavern Hall Body (width 10.0m, depth 8.0m, height 5.0m, centered at z = 0)
    const hallWallGeo = new THREE.BoxGeometry(10.0, 4.6, 8.0);
    this.disposables.push(hallWallGeo);
    const hallWalls = new THREE.Mesh(hallWallGeo, plasterWallMat);
    hallWalls.position.set(0, 2.84, 0);
    hallWalls.castShadow = true;
    hallWalls.receiveShadow = true;
    tavernGroup.add(hallWalls);

    // Half-timbered structural timber frame beams on exterior walls
    // Corner timber pillars
    [[-4.9, -3.9], [4.9, -3.9], [-4.9, 3.9], [4.9, 3.9]].forEach(([bx, bz]) => {
      const cornerPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 0.3), timberDarkMat);
      cornerPost.position.set(bx, 2.84, bz);
      cornerPost.castShadow = true;
      tavernGroup.add(cornerPost);
    });

    // Horizontal sill and top timber plates
    [0.6, 5.1].forEach(hy => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.22, 8.2), timberDarkMat);
      plate.position.set(0, hy, 0);
      tavernGroup.add(plate);
    });

    // 3. Gable Cedar Shingle Roof (Stepped A-frame pitch, apex at y = 7.6m)
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 9.4), cedarRoofMat);
    roofL.position.set(-2.8, 6.2, 0);
    roofL.rotation.z = 0.65;
    roofL.castShadow = true;
    tavernGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 9.4), cedarRoofMat);
    roofR.position.set(2.8, 6.2, 0);
    roofR.rotation.z = -0.65;
    roofR.castShadow = true;
    tavernGroup.add(roofR);

    // Roof Ridge Beam
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 9.6), timberDarkMat);
    ridgeBeam.position.set(0, 7.5, 0);
    tavernGroup.add(ridgeBeam);

    // Gable triangular wall infills
    const gableFront = new THREE.Mesh(new THREE.ConeGeometry(5.0, 2.4, 4), plasterWallMat);
    gableFront.position.set(0, 6.2, 4.0);
    gableFront.rotation.y = Math.PI / 4;
    tavernGroup.add(gableFront);

    // 4. Stone Chimney with warm hearth smoke (East side of tavern at x = 4.6)
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.2, 1.4), stonePlinthMat);
    chimney.position.set(4.6, 4.2, -1.5);
    chimney.castShadow = true;
    tavernGroup.add(chimney);

    const chimneyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.9, 8), timberDarkMat);
    chimneyPot.position.set(4.6, 8.6, -1.5);
    tavernGroup.add(chimneyPot);

    // 5. Sheltered Front Porch (width 10.0m, depth 3.6m, spans z: 4.0 to 7.6)
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 3.6), woodDeckMat);
    porchDeck.position.set(0, 0.50, 5.8);
    porchDeck.receiveShadow = true;
    tavernGroup.add(porchDeck);

    // Front Porch Arrival Steps (descending to ground at z = 7.9)
    const porchStep = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 1.2), stonePlinthMat);
    porchStep.position.set(0, 0.28, 7.8);
    porchStep.receiveShadow = true;
    tavernGroup.add(porchStep);

    // Porch carved timber posts (4 posts along front at z = 7.4)
    [-4.6, -1.5, 1.5, 4.6].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), timberDarkMat);
      post.position.set(px, 1.9, 7.4);
      post.castShadow = true;
      tavernGroup.add(post);
    });

    // Porch Canopy Roof (sloping forward from tavern wall)
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.16, 3.8), cedarRoofMat);
    canopyRoof.position.set(0, 3.4, 5.8);
    canopyRoof.rotation.x = 0.22;
    canopyRoof.castShadow = true;
    tavernGroup.add(canopyRoof);

    // 6. Arched Main Tavern Doorway (at front wall z = 4.05)
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.25), timberDarkMat);
    doorFrame.position.set(0, 1.95, 4.05);
    tavernGroup.add(doorFrame);

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.5, 0.15), timberDarkMat);
    doorPanel.position.set(0, 1.95, 4.12);
    tavernGroup.add(doorPanel);

    // Warm Leaded Glass Windows with welcoming interior glow
    [-2.8, 2.8].forEach(wx => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.2), timberDarkMat);
      winFrame.position.set(wx, 2.3, 4.05);
      tavernGroup.add(winFrame);

      const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), warmGlassMat);
      winGlass.position.set(wx, 2.3, 4.16);
      tavernGroup.add(winGlass);
    });

    // Brass Wall Lanterns with warm glow
    [-1.2, 1.2].forEach(lx => {
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.2), lanternGlowMat);
      lantern.position.set(lx, 2.8, 4.3);
      tavernGroup.add(lantern);
    });

    // 7. Hanging Tavern Signboard: "AGRI-GUILD TAVERN"
    const signGallows = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.2), timberDarkMat);
    signGallows.position.set(2.4, 3.3, 7.5);
    tavernGroup.add(signGallows);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 1.2), timberDarkMat);
    signBoard.position.set(2.4, 2.7, 7.5);
    signBoard.castShadow = true;
    tavernGroup.add(signBoard);

    // 8. Interactive Bounty Notice Board on Porch (Standing at x = -3.2, z = 6.2)
    const boardEaselL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.1), timberDarkMat);
    boardEaselL.position.set(-3.7, 1.5, 6.2);
    tavernGroup.add(boardEaselL);

    const boardEaselR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.1), timberDarkMat);
    boardEaselR.position.set(-2.7, 1.5, 6.2);
    tavernGroup.add(boardEaselR);

    const boardPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 0.1), timberDarkMat);
    boardPanel.position.set(-3.2, 1.65, 6.2);
    tavernGroup.add(boardPanel);

    // Pinned Bounty Quest Parchment (Glowing softly)
    const questParchment = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), parchmentMat);
    questParchment.position.set(-3.2, 1.65, 6.27);
    tavernGroup.add(questParchment);

    // 9. Outdoor Tavern Furnishings: Cider Barrels & Picnic Tables
    // 3 Oak Cider Barrels stacked at West porch corner
    [[-4.2, 5.0, 0], [-4.2, 6.0, 0], [-4.2, 5.5, 0.85]].forEach(([bx, bz, by]) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.95, 10), barrelWoodMat);
      barrel.position.set(bx, 1.05 + by, bz);
      barrel.castShadow = true;
      tavernGroup.add(barrel);
    });

    // Picnic Bench on East Porch
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), woodDeckMat);
    tableTop.position.set(3.4, 1.25, 6.0);
    tableTop.castShadow = true;
    tavernGroup.add(tableTop);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), woodDeckMat);
    bench.position.set(3.4, 0.95, 6.7);
    tavernGroup.add(bench);

    this.group.add(tavernGroup);
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
    const subPlinthGeo = new THREE.CylinderGeometry(4.6, 4.9, 3.2, 16);
    this.disposables.push(subPlinthGeo);
    const subPlinth = new THREE.Mesh(subPlinthGeo, subStoneMat);
    subPlinth.position.y = 2.4; // Spans y: 0.8m to 4.0m
    subPlinth.receiveShadow = true;
    hillGroup.add(subPlinth);

    // Terrace Upper Plinth & Curb (Spans y: 3.9m to 4.7m)
    const terracePlinthGeo = new THREE.CylinderGeometry(4.2, 4.6, 0.8, 16);
    this.disposables.push(terracePlinthGeo);
    const terracePlinth = new THREE.Mesh(terracePlinthGeo, terraceStoneMat);
    terracePlinth.position.y = 4.3;
    terracePlinth.receiveShadow = true;
    hillGroup.add(terracePlinth);

    // Flagstone Terrace Floor Slab (Radius 4.15m, top face at y = 4.78m)
    const terraceFloorGeo = new THREE.CylinderGeometry(4.15, 4.15, 0.14, 16);
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
      { width: 2.4, height: 0.22, depth: 1.0, y: 4.56, z: 3.8 },
      { width: 2.7, height: 0.22, depth: 1.0, y: 4.34, z: 4.6 },
      { width: 3.0, height: 0.22, depth: 1.1, y: 4.12, z: 5.4 }
    ].forEach(st => {
      const stepGeo = new THREE.BoxGeometry(st.width, st.height, st.depth);
      this.disposables.push(stepGeo);
      const step = new THREE.Mesh(stepGeo, terraceStoneMat);
      step.position.set(0, st.y, st.z);
      step.receiveShadow = true;
      arrivalGroup.add(step);
    });
    hillGroup.add(arrivalGroup);

    // Terrace Perimeter Wooden Railing (Radius 4.0m, leaving 2.8m opening for steps)
    const railPostCount = 14;
    const railRadius = 4.02;
    for (let r = 0; r < railPostCount; r++) {
      const pAngle = (r / railPostCount) * Math.PI * 2;
      // Skip posts across the doorway / arrival stairs sector (near arrivalAngle)
      let diffAngle = Math.abs(pAngle - (arrivalAngle + Math.PI * 2) % (Math.PI * 2));
      if (diffAngle > Math.PI) diffAngle = Math.PI * 2 - diffAngle;
      if (diffAngle < 0.42) continue;

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
    // 3. OCTAGONAL LOWER STONE TOWER (Base radius 2.2m for wide 1.8m terrace walkway!)
    // ─────────────────────────────────────────────────────────────────────────────
    const towerGeo = new THREE.CylinderGeometry(1.8, 2.25, 5.1, 8);
    this.disposables.push(towerGeo);
    const tower = new THREE.Mesh(towerGeo, towerStoneMat);
    tower.position.y = 7.25;
    tower.castShadow = true;
    tower.receiveShadow = true;
    hillGroup.add(tower);

    // Arched Timber Entrance Doorway (Facing North-West towards arrival steps)
    const doorGroup = new THREE.Group();
    doorGroup.rotation.y = arrivalAngle;

    // Door Frame
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 0.25), timberDarkMat);
    doorFrame.position.set(0, 5.85, 2.15);
    doorGroup.add(doorFrame);

    // Wooden Door Panel
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.1, 0.15), timberCedarMat);
    doorPanel.position.set(0, 5.85, 2.22);
    doorGroup.add(doorPanel);

    // Iron Door Handle
    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), ironMat);
    doorKnob.position.set(0.38, 5.85, 2.30);
    doorGroup.add(doorKnob);

    // Wall Lantern next to doorway
    const lanternBracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.35), ironMat);
    lanternBracket.position.set(0.85, 6.25, 2.15);
    doorGroup.add(lanternBracket);

    const lanternCage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), ironMat);
    lanternCage.position.set(0.85, 6.15, 2.38);
    doorGroup.add(lanternCage);

    const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lanternGlowMat);
    lanternBulb.position.set(0.85, 6.15, 2.38);
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
        if (distToLake < 20.2 && !(Math.abs(posX - (-35)) < 2.0 && (posZ <= 15.2 || posZ >= 55.5))) {
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

    // Path 2: Greenhouse to Irrigation Lake Bridge Ramp (South-West)
    // Seamlessly connects to the wooden bridge ramp at (-35, 14.2)
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

    // Path 6: South Lake Bridge Exit to Southern Scenic Hills
    createPath([
      new THREE.Vector3(-35, 0, 56.5),
      new THREE.Vector3(-28, 0, 61.0),
      new THREE.Vector3(-16, 0, 64.0),
      new THREE.Vector3(0, 0, 62.0)
    ], 28);
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
