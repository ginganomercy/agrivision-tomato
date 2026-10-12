/**
 * GreenhousePavilion - Botanical Glasshouse Architecture ("Ruang Laboratorium Botani")
 * Features glazed terracotta tiled floor, white structural steel columns,
 * transparent glass gable roof, open entrance doorway, workbenches, and seedling pots.
 */
import * as THREE from 'three';

export class GreenhousePavilion {
  private group: THREE.Group;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Spatial boundaries (meters)
  public static readonly WIDTH = 18;   // X: -9 to +9
  public static readonly DEPTH = 14;   // Z: -7 to +7
  public static readonly HEIGHT = 6.5;

  constructor() {
    this.group = new THREE.Group();
    this.buildTerracottaFloor();
    this.buildSteelStructure();
    this.buildGlassEnvelope();
    this.buildInteriorFurnishings();
    this.buildInteriorLighting();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public isInside(x: number, z: number): boolean {
    const halfW = GreenhousePavilion.WIDTH / 2;
    const halfD = GreenhousePavilion.DEPTH / 2;
    return x >= -halfW && x <= halfW && z >= -halfD && z <= halfD;
  }

  private buildTerracottaFloor(): void {
    // Terracotta tiled base - raised to y = 0.06 with top face at y = 0.14 to eliminate z-fighting
    const floorGeo = new THREE.BoxGeometry(GreenhousePavilion.WIDTH, 0.16, GreenhousePavilion.DEPTH);
    this.disposables.push(floorGeo);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xbf573f, // Warm Tuscan terracotta
      roughness: 0.45,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    this.disposables.push(floorMat);

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.06, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Decorative perimeter curb / base foundation
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    this.disposables.push(curbMat);

    const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(GreenhousePavilion.WIDTH + 0.4, 0.4, 0.4), curbMat);
    curbNorth.position.set(0, 0.20, -GreenhousePavilion.DEPTH / 2);
    this.group.add(curbNorth);

    const curbWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, GreenhousePavilion.DEPTH), curbMat);
    curbWest.position.set(-GreenhousePavilion.WIDTH / 2, 0.20, 0);
    this.group.add(curbWest);

    const curbEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, GreenhousePavilion.DEPTH), curbMat);
    curbEast.position.set(GreenhousePavilion.WIDTH / 2, 0.20, 0);
    this.group.add(curbEast);

    // South curb with open doorway (gap between x = -2.5 and +2.5)
    const curbSouthLeft = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 0.4), curbMat);
    curbSouthLeft.position.set(-5.75, 0.20, GreenhousePavilion.DEPTH / 2);
    this.group.add(curbSouthLeft);

    const curbSouthRight = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 0.4), curbMat);
    curbSouthRight.position.set(5.75, 0.20, GreenhousePavilion.DEPTH / 2);
    this.group.add(curbSouthRight);
  }

  private buildSteelStructure(): void {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fa, // Clean architectural white steel
      roughness: 0.35,
      metalness: 0.2
    });
    this.disposables.push(steelMat);

    const colGeo = new THREE.BoxGeometry(0.25, 4.0, 0.25);
    this.disposables.push(colGeo);

    // Columns along North and South walls
    const xOffsets = [-8.5, -4.5, 0, 4.5, 8.5];
    xOffsets.forEach(x => {
      // North column
      const colN = new THREE.Mesh(colGeo, steelMat);
      colN.position.set(x, 2.0, -GreenhousePavilion.DEPTH / 2);
      colN.castShadow = true;
      this.group.add(colN);

      // South column (leave doorway open at center x=0)
      if (Math.abs(x) > 1.5) {
        const colS = new THREE.Mesh(colGeo, steelMat);
        colS.position.set(x, 2.0, GreenhousePavilion.DEPTH / 2);
        colS.castShadow = true;
        this.group.add(colS);
      }
    });

    // Doorway portal posts (x = -2.5 and +2.5)
    [-2.5, 2.5].forEach(x => {
      const portalPost = new THREE.Mesh(colGeo, steelMat);
      portalPost.position.set(x, 2.0, GreenhousePavilion.DEPTH / 2);
      portalPost.castShadow = true;
      this.group.add(portalPost);
    });

    // Horizontal top perimeter ring beams
    const beamN = new THREE.Mesh(new THREE.BoxGeometry(GreenhousePavilion.WIDTH, 0.2, 0.25), steelMat);
    beamN.position.set(0, 4.0, -GreenhousePavilion.DEPTH / 2);
    this.group.add(beamN);

    const beamS = new THREE.Mesh(new THREE.BoxGeometry(GreenhousePavilion.WIDTH, 0.2, 0.25), steelMat);
    beamS.position.set(0, 4.0, GreenhousePavilion.DEPTH / 2);
    this.group.add(beamS);

    // Roof Gable Trusses
    xOffsets.forEach(x => {
      // Left rafter
      const rafterL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 7.8), steelMat);
      rafterL.position.set(x, 5.0, -3.5);
      rafterL.rotation.x = 0.26;
      this.group.add(rafterL);

      // Right rafter
      const rafterR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 7.8), steelMat);
      rafterR.position.set(x, 5.0, 3.5);
      rafterR.rotation.x = -0.26;
      this.group.add(rafterR);
    });

    // Central Ridge Beam (Apex of roof)
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(GreenhousePavilion.WIDTH, 0.22, 0.22), steelMat);
    ridgeBeam.position.set(0, 6.0, 0);
    this.group.add(ridgeBeam);
  }

  private buildGlassEnvelope(): void {
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xd6f0ff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    this.disposables.push(glassMat);

    // North Glass Wall
    const glassN = new THREE.Mesh(new THREE.PlaneGeometry(GreenhousePavilion.WIDTH - 0.4, 3.8), glassMat);
    glassN.position.set(0, 2.0, -GreenhousePavilion.DEPTH / 2 + 0.05);
    this.group.add(glassN);

    // West Glass Wall
    const glassW = new THREE.Mesh(new THREE.PlaneGeometry(GreenhousePavilion.DEPTH - 0.4, 3.8), glassMat);
    glassW.position.set(-GreenhousePavilion.WIDTH / 2 + 0.05, 2.0, 0);
    glassW.rotation.y = Math.PI / 2;
    this.group.add(glassW);

    // East Glass Wall
    const glassE = new THREE.Mesh(new THREE.PlaneGeometry(GreenhousePavilion.DEPTH - 0.4, 3.8), glassMat);
    glassE.position.set(GreenhousePavilion.WIDTH / 2 - 0.05, 2.0, 0);
    glassE.rotation.y = -Math.PI / 2;
    this.group.add(glassE);

    // Sloped Glass Roof Panels
    const roofSlopeL = new THREE.Mesh(new THREE.PlaneGeometry(GreenhousePavilion.WIDTH - 0.2, 7.6), glassMat);
    roofSlopeL.position.set(0, 5.0, -3.5);
    roofSlopeL.rotation.x = Math.PI / 2 - 0.26;
    this.group.add(roofSlopeL);

    const roofSlopeR = new THREE.Mesh(new THREE.PlaneGeometry(GreenhousePavilion.WIDTH - 0.2, 7.6), glassMat);
    roofSlopeR.position.set(0, 5.0, 3.5);
    roofSlopeR.rotation.x = Math.PI / 2 + 0.26;
    this.group.add(roofSlopeR);
  }

  private buildInteriorFurnishings(): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x825432, roughness: 0.7 });
    const potMat = new THREE.MeshStandardMaterial({ color: 0xc45c38, roughness: 0.6 });
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x3d942b, roughness: 0.5 });
    this.disposables.push(woodMat, potMat, plantMat);

    // Left botanical workbench
    this.createWorkbench(-6.5, -2.5, woodMat, potMat, plantMat);
    // Right botanical workbench
    this.createWorkbench(6.5, -2.5, woodMat, potMat, plantMat);

    // Wooden harvest crates near North wall
    this.createCrate(-2.0, -5.5, woodMat);
    this.createCrate(-0.8, -5.5, woodMat);
    this.createCrate(2.5, -5.5, woodMat);
  }

  private createWorkbench(x: number, z: number, woodMat: THREE.Material, potMat: THREE.Material, plantMat: THREE.Material): void {
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.2), woodMat);
    tableTop.position.set(x, 1.0, z);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.group.add(tableTop);

    // 4 legs
    [[-1.4, -0.45], [1.4, -0.45], [-1.4, 0.45], [1.4, 0.45]].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), woodMat);
      leg.position.set(x + dx, 0.5, z + dz);
      leg.castShadow = true;
      this.group.add(leg);
    });

    // Seedling Pots on table
    [-1.0, -0.3, 0.4, 1.1].forEach(dx => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 8), potMat);
      pot.position.set(x + dx, 1.16, z);
      pot.castShadow = true;
      this.group.add(pot);

      // Microgreen shoot
      const shoot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), plantMat);
      shoot.position.set(x + dx, 1.30, z);
      this.group.add(shoot);
    });
  }

  private createCrate(x: number, z: number, woodMat: THREE.Material): void {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), woodMat);
    crate.position.set(x, 0.3, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.group.add(crate);
  }

  private buildInteriorLighting(): void {
    // Warm accent light inside greenhouse
    const interiorLight = new THREE.PointLight(0xffecd1, 1.8, 16, 1.2);
    interiorLight.position.set(0, 4.5, 0);
    this.group.add(interiorLight);

    // Hanging pendant lamps
    [-4.5, 4.5].forEach(x => {
      const lamp = new THREE.PointLight(0xfff1db, 1.2, 12, 1.5);
      lamp.position.set(x, 3.8, 0);
      this.group.add(lamp);

      const lampCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      lampCone.position.set(x, 3.9, 0);
      this.group.add(lampCone);
    });
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
