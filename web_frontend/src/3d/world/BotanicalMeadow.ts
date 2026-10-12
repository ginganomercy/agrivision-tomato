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
import { LakeAndBridgeBuilder } from './meadow/LakeAndBridgeBuilder';
import { GuildTavernExteriorBuilder } from './meadow/GuildTavernExteriorBuilder';
import { WindmillBuilder } from './meadow/WindmillBuilder';
import { FloraFaunaBuilder, type Butterfly } from './meadow/FloraFaunaBuilder';

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

  // Spatial boundaries (meters)
  public static readonly MEADOW_SIZE = 180; // 180x180m open world
  public static readonly BOUNDARY_RADIUS = 84.0;

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
