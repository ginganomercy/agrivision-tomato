/**
 * BotanicalMeadow - Expansive Living Botanical Open-World (260m x 260m)
 * Features 9 distinct agricultural & natural zones:
 * 1. Central Laboratory & Greenhouse Pavilion
 * 2. Commercial Heirloom Trellis Rows (East Orchard)
 * 3. Wildflower Pollinator Meadow with Animated Butterflies (West Sanctuary)
 * 4. Irrigation Reservoir Lake with Water Lilies & Wooden Dock (South-West)
 * 5. Elevated Windmill Hill with Rotating Blades (South-East)
 * 6. Ancient Agricultural Ruins (North) — Stone pillars & rune altars
 * 7. Sawah Irigasi & Sungai Mengalir (Far East)
 * 8. Hutan Jamur Misterius (Far West) — Glowing spores & cave
 * 9. Pasar Panen Terbuka / Harvest Bazaar (South-Center)
 * Plus outer pine tree forest perimeter, drifting cumulus clouds, and golden pollen spores.
 */
import * as THREE from 'three';
import { LakeAndBridgeBuilder } from './meadow/LakeAndBridgeBuilder';
import { GuildTavernExteriorBuilder } from './meadow/GuildTavernExteriorBuilder';
import { WindmillBuilder } from './meadow/WindmillBuilder';
import { FloraFaunaBuilder, type Butterfly } from './meadow/FloraFaunaBuilder';
import { AncientRuinsBuilder } from './meadow/AncientRuinsBuilder';
import { RiceFieldBuilder } from './meadow/RiceFieldBuilder';
import { MushroomForestBuilder } from './meadow/MushroomForestBuilder';
import { HarvestBazaarBuilder } from './meadow/HarvestBazaarBuilder';

export class BotanicalMeadow {
  private group: THREE.Group;
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // Animated elements
  private windmillBladesGroup: THREE.Group | null = null;
  private butterflies: Butterfly[] = [];
  private cloudsGroup: THREE.Group = new THREE.Group();
  private particlePoints!: THREE.Points;
  private particlePositions!: Float32Array;

  // Dynamic Tavern Entrance Door Hinge
  private tavernDoorHingeGroup!: THREE.Group;
  private tavernDoorRotation: number = 0;

  // Biome zone groups — exposed for zone-based visibility culling
  private ruinsGroup!: THREE.Group;
  private riceGroup!: THREE.Group;
  private mushroomGroup!: THREE.Group;
  private bazaarGroup!: THREE.Group;

  // Spatial boundaries (meters)
  public static readonly MEADOW_SIZE = 260; // 260x260m open world
  public static readonly BOUNDARY_RADIUS = 122.0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Build Base Ground Terrain Mesh
    this.buildExpansiveTerrain();

    // 2. Delegate Lake & Arch Bridge to LakeAndBridgeBuilder
    const lakeGroup = LakeAndBridgeBuilder.build(this.disposables);
    this.group.add(lakeGroup);

    // 3. Delegate Guild Tavern Exterior to GuildTavernExteriorBuilder
    const { tavernGroup, doorHingeGroup } = GuildTavernExteriorBuilder.build(this.disposables);
    this.tavernDoorHingeGroup = doorHingeGroup;
    this.group.add(tavernGroup);

    // 4. Delegate Windmill Hill to WindmillBuilder
    const { hillGroup, windmillBladesGroup } = WindmillBuilder.build(this.disposables);
    this.windmillBladesGroup = windmillBladesGroup;
    this.group.add(hillGroup);

    // 5. Delegate Trellis, Sanctuary, Pathways, Forest & Atmosphere to FloraFaunaBuilder
    const floraFauna = FloraFaunaBuilder.build(this.disposables, BotanicalMeadow.getTerrainHeight);
    this.butterflies = floraFauna.butterflies;
    this.cloudsGroup = floraFauna.cloudsGroup;
    this.particlePoints = floraFauna.particlePoints;
    this.particlePositions = floraFauna.particlePositions;
    this.group.add(floraFauna.group);

    // 6. New Biome Zones (Sprint 1 Expansion)
    // 6a. Ancient Agricultural Ruins (North: x∈[-25,25], z∈[-80,-50])
    this.ruinsGroup = AncientRuinsBuilder.build(this.disposables);
    this.group.add(this.ruinsGroup);

    // 6b. Sawah Irigasi & Sungai (Far East: x∈[60,100], z∈[-20,40])
    this.riceGroup = RiceFieldBuilder.build(this.disposables);
    this.group.add(this.riceGroup);

    // 6c. Hutan Jamur Misterius (Far West: x∈[-100,-60], z∈[-20,40])
    this.mushroomGroup = MushroomForestBuilder.build(this.disposables);
    this.group.add(this.mushroomGroup);

    // 6d. Pasar Panen Terbuka (South-Center: x∈[-30,30], z∈[60,100])
    this.bazaarGroup = HarvestBazaarBuilder.build(this.disposables);
    this.group.add(this.bazaarGroup);
  }

  // Zone group accessors for visibility culling by WorldEngine
  public getBiomeGroups(): { ruins: THREE.Group; rice: THREE.Group; mushroom: THREE.Group; bazaar: THREE.Group } {
    return {
      ruins: this.ruinsGroup,
      rice: this.riceGroup,
      mushroom: this.mushroomGroup,
      bazaar: this.bazaarGroup
    };
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

    // 4. North Ancient Ruins – flat plateau with slight ancient sunken depression
    if (x >= -28 && x <= 28 && z >= -85 && z <= -48) {
      const ruinDist = Math.hypot(x / 28, (z + 65) / 18);
      if (ruinDist < 1.0) return -0.12 + Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.08;
      return 0.1 + Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.15;
    }

    // 5. Far East Sawah – flat floodplain (paddy field needs level ground)
    if (x >= 58 && x <= 105 && z >= -22 && z <= 42) {
      return -0.05 + Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.06;
    }

    // 6. Far West Mushroom Forest – gently rolling hills
    if (x >= -105 && x <= -58 && z >= -22 && z <= 42) {
      const mxRel = (x + 80) / 22;
      const mzRel = (z + 0) / 22;
      return 0.2 + Math.sin(mxRel * Math.PI) * Math.cos(mzRel * Math.PI) * 0.8;
    }

    // 7. South Harvest Bazaar – mild cobblestone plaza (slightly elevated)
    if (x >= -32 && x <= 32 && z >= 58 && z <= 105) {
      return 0.05 + Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.04;
    }

    // 8. Perimeter Mountain Ridge around map edge (r > 108m)
    const distFromCenter = Math.hypot(x, z);
    if (distFromCenter > 108) {
      const outerRise = Math.pow((distFromCenter - 108) / 14, 2) * 8.0;
      const wave = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 2.0;
      return outerRise + wave;
    }

    // 9. Gentle undulating agricultural terrain
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
    if (x >= -20.0 && x <= -8.0 && z >= 13.0 && z <= 27.0) {
      if (z >= 13.5 && z <= 22.0) return 0.54; // Inside Tavern Hall
      if (z > 22.0 && z <= 25.5) return 0.50;  // Front Porch Deck
      if (z > 25.5 && z <= 26.8 && Math.abs(x - (-14)) <= 2.2) return 0.28; // Porch Step
    }

    // 3. Grand Botanical Lake Arch Bridge & Central Lotus Gazebo (Center: x=-35, z=35)
    const distToLakeCenter = Math.hypot(x - (-35), z - 35);
    if (distToLakeCenter <= 4.5) {
      return 0.45; // Solid wooden gazebo deck
    }

    // Bridge Walkway Spans: Width 3.8m (Math.abs(x - (-35)) <= 2.05)
    if (Math.abs(x - (-35)) <= 2.05 && z >= 13.5 && z <= 56.5) {
      if (z < 17.0) {
        const rampNorm = (z - 13.5) / 3.5;
        return 0.08 + rampNorm * 0.20;
      }
      if (z <= 30.5) {
        const u = (z - 17.0) / 13.5;
        return 0.28 + (0.45 - 0.28) * u + Math.sin(u * Math.PI) * 0.22;
      }
      if (z >= 39.5 && z <= 53.0) {
        const v = (z - 39.5) / 13.5;
        return 0.45 - (0.45 - 0.28) * v + Math.sin(v * Math.PI) * 0.22;
      }
      if (z > 53.0) {
        const w = (z - 53.0) / 3.5;
        return 0.28 - w * 0.20;
      }
      return 0.45;
    }

    // 4. Harvest Bazaar central plaza floor (flat cobblestone y=0.08)
    if (x >= -30 && x <= 30 && z >= 60 && z <= 98) {
      return 0.08;
    }

    // 5. Ancient Ruins altar platform (x∈[-6,6], z∈[-72,-60])
    if (Math.abs(x) <= 6.5 && z >= -72 && z <= -60) {
      return 0.22; // Altar platform stone floor
    }

    // 6. Rice Field paddy plots – flat field surface for walking between rows
    if (x >= 60 && x <= 102 && z >= -18 && z <= 38) {
      return 0.0; // Flooded paddy floor
    }

    // Default to natural procedural terrain elevation
    return BotanicalMeadow.getTerrainHeight(x, z);
  }

  /**
   * Constructs procedurally contoured 180m terrain with lake basin and windmill hill
   */
  private buildExpansiveTerrain(): void {
    const segs = 96; // Increased from 64 for higher detail on expanded 260m terrain
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
   * Frame animation update for windmill, butterflies, clouds, and particles
   */
  public update(deltaTime: number, elapsedTime: number): void {
    // 1. Rotate Windmill Sails
    if (this.windmillBladesGroup) {
      this.windmillBladesGroup.rotation.z += deltaTime * 0.9;
    }

    // 2. Animate Butterflies, Clouds, and Spores
    FloraFaunaBuilder.update(
      deltaTime,
      elapsedTime,
      this.butterflies,
      this.cloudsGroup,
      this.particlePoints,
      this.particlePositions
    );
  }

  /**
   * Updates Tavern Entrance Door Hinge Swing:
   * When player stands on the front porch and approaches the door (within 2.5m),
   * the door smoothly swings open inwards into the tavern!
   */
  public updateTavernDoor(deltaTime: number, playerPos: THREE.Vector3): void {
    if (!this.tavernDoorHingeGroup) return;

    const doorWorldPos = new THREE.Vector3(-14.0, 1.2, 22.05);
    const distToDoor = playerPos.distanceTo(doorWorldPos);

    let targetAngle = 0;
    if (distToDoor <= 2.5 && playerPos.z >= 22.0 && playerPos.z <= 25.2) {
      targetAngle = -Math.PI * 0.48;
    }

    this.tavernDoorRotation = THREE.MathUtils.lerp(
      this.tavernDoorRotation,
      targetAngle,
      Math.min(1.0, deltaTime * 6.0)
    );
    this.tavernDoorHingeGroup.rotation.y = this.tavernDoorRotation;
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.butterflies = [];
  }
}
