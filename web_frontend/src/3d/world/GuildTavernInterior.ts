/**
 * GuildTavernInterior - Expansive 3D Architecture for Agri-Guild Tavern & Bounty Hall
 * Provides a grand, double-height medieval/pastoral guild hall (24m x 18m x 7.5m, >400 sqm)
 * Features polished oak parquet floor, cathedral vaulted timber trusses, walk-in stone fireplace,
 * long oak bar counter with cider taps, feast tables, wagon wheel chandeliers, and animated exit door.
 */
import * as THREE from 'three';

export class GuildTavernInterior {
  private group: THREE.Group;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Interior Door Animation State
  private doorHingeGroup!: THREE.Group;
  private doorRotation: number = 0;
  private fireplaceLight!: THREE.PointLight;
  private chandelierLights: THREE.PointLight[] = [];

  // Spatial Dimensions (Meters)
  public static readonly CENTER_X = -14.0;
  public static readonly FLOOR_Y = -39.90;
  public static readonly CENTER_Z = 18.0;
  public static readonly WIDTH = 24.0;   // X: -26.0 to -2.0
  public static readonly DEPTH = 18.0;   // Z: 9.0 to 27.0
  public static readonly HEIGHT = 7.5;   // Y: -39.90 to -32.40

  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(GuildTavernInterior.CENTER_X, GuildTavernInterior.FLOOR_Y, GuildTavernInterior.CENTER_Z);

    this.buildGrandStructure();
    this.buildStoneFireplace();
    this.buildTavernBarCounter();
    this.buildFeastTables();
    this.buildLightingAndChandeliers();
    this.buildGuildBountyDais();
    this.buildAnimatedExitDoor();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  private buildGrandStructure(): void {
    // 1. Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d2412, // Rich dark polished oak
      roughness: 0.35,
      metalness: 0.1
    });
    const stoneWallMat = new THREE.MeshStandardMaterial({
      color: 0x5a544c, // Medieval dressed fieldstone lower wainscot
      roughness: 0.92
    });
    const plasterWallMat = new THREE.MeshStandardMaterial({
      color: 0xded2be, // Warm antique plaster
      roughness: 0.85
    });
    const timberDarkMat = new THREE.MeshStandardMaterial({
      color: 0x2b170a, // Heavy structural aged oak
      roughness: 0.78
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x241409, // Dark cathedral wooden ceiling boards
      roughness: 0.85
    });

    this.disposables.push(floorMat, stoneWallMat, plasterWallMat, timberDarkMat, ceilingMat);

    // 2. Grand Polished Oak Floor (24m x 18m)
    const floorGeo = new THREE.BoxGeometry(GuildTavernInterior.WIDTH, 0.2, GuildTavernInterior.DEPTH);
    this.disposables.push(floorGeo);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, 0); // Top surface at y = 0.1 (local)
    floor.receiveShadow = true;
    this.group.add(floor);

    // Deep sub-floor foundation slab
    const subFloor = new THREE.Mesh(
      new THREE.BoxGeometry(GuildTavernInterior.WIDTH + 1.0, 0.8, GuildTavernInterior.DEPTH + 1.0),
      stoneWallMat
    );
    subFloor.position.set(0, -0.4, 0);
    this.group.add(subFloor);

    // 3. Vaulted Cathedral Ceiling (Pitch roof with ridge beam at y = 7.5m)
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 8.8, GuildTavernInterior.DEPTH + 0.4), ceilingMat);
    roofLeft.position.set(-6.2, 5.8, 0);
    roofLeft.rotation.z = 0.52;
    this.group.add(roofLeft);

    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 8.8, GuildTavernInterior.DEPTH + 0.4), ceilingMat);
    roofRight.position.set(6.2, 5.8, 0);
    roofRight.rotation.z = -0.52;
    this.group.add(roofRight);

    // Ridge Beam
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, GuildTavernInterior.DEPTH + 0.6), timberDarkMat);
    ridgeBeam.position.set(0, 7.5, 0);
    this.group.add(ridgeBeam);

    // 5 Timber A-Frame Cross Trusses along the hall
    [-7.5, -3.75, 0, 3.75, 7.5].forEach(tz => {
      // Horizontal tie beam
      const tieBeam = new THREE.Mesh(new THREE.BoxGeometry(GuildTavernInterior.WIDTH - 0.4, 0.35, 0.35), timberDarkMat);
      tieBeam.position.set(0, 4.4, tz);
      this.group.add(tieBeam);

      // King post
      const kingPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.1, 0.3), timberDarkMat);
      kingPost.position.set(0, 5.95, tz);
      this.group.add(kingPost);
    });

    // 4. Perimeter Walls (Hollow, Spacious Room)
    const halfW = GuildTavernInterior.WIDTH / 2; // 12.0
    const halfD = GuildTavernInterior.DEPTH / 2; // 9.0

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(GuildTavernInterior.WIDTH, 5.2, 0.4), plasterWallMat);
    northWall.position.set(0, 2.6, -halfD);
    northWall.receiveShadow = true;
    this.group.add(northWall);

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, GuildTavernInterior.DEPTH), plasterWallMat);
    westWall.position.set(-halfW, 2.6, 0);
    westWall.receiveShadow = true;
    this.group.add(westWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, GuildTavernInterior.DEPTH), plasterWallMat);
    eastWall.position.set(halfW, 2.6, 0);
    eastWall.receiveShadow = true;
    this.group.add(eastWall);

    // South Wall (Front Entrance Wall with 2.4m central door opening)
    // Left South Wall panel
    const southWallL = new THREE.Mesh(new THREE.BoxGeometry(halfW - 1.2, 5.2, 0.4), plasterWallMat);
    southWallL.position.set(-(halfW + 1.2) / 2, 2.6, halfD);
    this.group.add(southWallL);

    // Right South Wall panel
    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(halfW - 1.2, 5.2, 0.4), plasterWallMat);
    southWallR.position.set((halfW + 1.2) / 2, 2.6, halfD);
    this.group.add(southWallR);

    // Over-door transom lintel
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.45), timberDarkMat);
    doorLintel.position.set(0, 4.3, halfD);
    this.group.add(doorLintel);

    // Stone Wainscot base along perimeter interior
    const wainscotGeo = new THREE.BoxGeometry(GuildTavernInterior.WIDTH - 0.2, 1.2, 0.15);
    const wainscotNorth = new THREE.Mesh(wainscotGeo, stoneWallMat);
    wainscotNorth.position.set(0, 0.7, -halfD + 0.15);
    this.group.add(wainscotNorth);
  }

  private buildStoneFireplace(): void {
    // Grand Walk-In Hearth at East Wall (x = 10.8, z = 0)
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x48423a, roughness: 0.95 });
    const hearthMat = new THREE.MeshStandardMaterial({ color: 0x1f1a14, roughness: 0.9 });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff4500,
      emissiveIntensity: 1.8,
      roughness: 0.3
    });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3d2010, roughness: 0.85 });

    this.disposables.push(stoneMat, hearthMat, emberMat, logMat);

    // Stone Chimney Breast
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.8, 7.2, 4.4), stoneMat);
    chimney.position.set(10.5, 3.6, 0);
    this.group.add(chimney);

    // Hollow Hearth Firebox
    const firebox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 2.6), hearthMat);
    firebox.position.set(10.2, 1.2, 0);
    this.group.add(firebox);

    // Carved Timber Mantelpiece
    const mantel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 4.8), new THREE.MeshStandardMaterial({ color: 0x381e0d }));
    mantel.position.set(9.0, 2.7, 0);
    this.group.add(mantel);

    // Stacked Burning Logs with glowing embers
    const embers = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 1.8), emberMat);
    embers.position.set(9.8, 0.22, 0);
    this.group.add(embers);

    [[-0.2, 0.35, -0.4], [0.2, 0.35, 0.3], [0, 0.55, 0]].forEach(([lx, ly, lz]) => {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8), logMat);
      log.position.set(9.8 + lx, ly, lz);
      log.rotation.x = Math.PI / 2;
      log.rotation.z = lx * 0.4;
      this.group.add(log);
    });

    // Flickering Point Light from Fireplace
    this.fireplaceLight = new THREE.PointLight(0xff7722, 2.2, 18, 1.2);
    this.fireplaceLight.position.set(9.2, 1.4, 0);
    this.group.add(this.fireplaceLight);
  }

  private buildTavernBarCounter(): void {
    // 10-meter L-Shaped Oak Bar Counter at West Wall
    const counterTopMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.3, metalness: 0.05 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.8 });
    const kegMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.7 });
    const potionMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85
    });

    this.disposables.push(counterTopMat, brassMat, kegMat, potionMat);

    // Main Counter (along Z: -4.5 to 4.5)
    const barCounter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.25, 9.0), counterTopMat);
    barCounter.position.set(-8.2, 0.72, 0);
    this.group.add(barCounter);

    // Return Counter (L-Shape towards West wall)
    const barReturn = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.25, 1.2), counterTopMat);
    barReturn.position.set(-9.8, 0.72, -4.0);
    this.group.add(barReturn);

    // Brass Footrail
    const footrail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 9.2, 8), brassMat);
    footrail.position.set(-7.5, 0.25, 0);
    this.group.add(footrail);

    // 4 Oak Cider Kegs on back bar shelf
    [-3.0, -1.0, 1.0, 3.0].forEach(kz => {
      const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.95, 10), kegMat);
      keg.position.set(-10.8, 1.6, kz);
      keg.rotation.z = Math.PI / 2;
      this.group.add(keg);

      // Brass tap
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6), brassMat);
      tap.position.set(-10.25, 1.5, kz);
      tap.rotation.z = Math.PI / 2;
      this.group.add(tap);
    });

    // Potion / Cider Display Shelves (North-West corner)
    [-2.0, 0, 2.0].forEach(pz => {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.38, 8), potionMat);
      bottle.position.set(-8.2, 1.55, pz);
      this.group.add(bottle);
    });
  }

  private buildFeastTables(): void {
    const oakTableMat = new THREE.MeshStandardMaterial({ color: 0x482914, roughness: 0.65 });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x3d2210, roughness: 0.7 });
    const pewterMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const candleGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b3,
      emissive: 0xffb84d,
      emissiveIntensity: 1.2
    });

    this.disposables.push(oakTableMat, benchMat, pewterMat, candleGlowMat);

    // 1. Grand Center Banquet Table (8.0m x 2.2m)
    const banquetTable = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 7.6), oakTableMat);
    banquetTable.position.set(0, 0.95, -1.0);
    this.group.add(banquetTable);

    // Banquet Benches (West and East of table)
    [-1.9, 1.9].forEach(bx => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 7.4), benchMat);
      bench.position.set(bx, 0.55, -1.0);
      this.group.add(bench);
    });

    // Feast tankards and candles along banquet table
    [-2.5, -0.8, 0.8, 2.5].forEach(tz => {
      const tankard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.28, 8), pewterMat);
      tankard.position.set(0.6, 1.18, -1.0 + tz);
      this.group.add(tankard);

      // Ceramic candle holder
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), candleGlowMat);
      candle.position.set(-0.5, 1.25, -1.0 + tz);
      this.group.add(candle);
    });

    // 2. Round Cozy Tavern Tables (South side)
    [[-4.5, 4.5], [4.5, 4.5]].forEach(([tx, tz]) => {
      const roundTable = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 16), oakTableMat);
      roundTable.position.set(tx, 0.92, tz);
      this.group.add(roundTable);

      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 0.86, 8), benchMat);
      tableLeg.position.set(tx, 0.43, tz);
      this.group.add(tableLeg);

      // 4 Stools around round table
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8), benchMat);
        stool.position.set(tx + Math.cos(ang) * 1.6, 0.35, tz + Math.sin(ang) * 1.6);
        this.group.add(stool);
      }
    });
  }

  private buildLightingAndChandeliers(): void {
    const wheelWoodMat = new THREE.MeshStandardMaterial({ color: 0x361d0d, roughness: 0.8 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      emissive: 0xff9900,
      emissiveIntensity: 1.4
    });

    this.disposables.push(wheelWoodMat, brassMat, lanternGlowMat);

    // 3 Hanging Wagon Wheel Chandeliers along hall center (z = -4.5, 0, 4.5)
    [-4.5, 0, 4.5].forEach(cz => {
      const chandelierGroup = new THREE.Group();
      chandelierGroup.position.set(0, 4.8, cz);

      // Wooden Wheel Rim
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 20), wheelWoodMat);
      wheel.rotation.x = Math.PI / 2;
      chandelierGroup.add(wheel);

      // Hub & Spokes
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 8), wheelWoodMat);
      chandelierGroup.add(hub);

      // 6 Lanterns around wheel
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), lanternGlowMat);
        lantern.position.set(Math.cos(ang) * 1.4, 0.15, Math.sin(ang) * 1.4);
        chandelierGroup.add(lantern);
      }

      // Warm Point Light
      const pLight = new THREE.PointLight(0xffaa44, 1.4, 14, 1.2);
      pLight.position.set(0, -0.2, 0);
      chandelierGroup.add(pLight);
      this.chandelierLights.push(pLight);

      this.group.add(chandelierGroup);
    });

    // Ambient interior warm fill
    const ambientIn = new THREE.AmbientLight(0xfff0d0, 0.55);
    this.group.add(ambientIn);
  }

  private buildGuildBountyDais(): void {
    // North Dais (Guild Master Platform at x = 0, z = -7.5)
    const daisMat = new THREE.MeshStandardMaterial({ color: 0x422612, roughness: 0.7 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.85 }); // Emerald Guild Green
    const parchmentMat = new THREE.MeshStandardMaterial({ color: 0xf5eed9, roughness: 0.9 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });

    this.disposables.push(daisMat, bannerMat, parchmentMat, hornMat);

    // Raised Dais Platform
    const dais = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.4, 2.6), daisMat);
    dais.position.set(0, 0.28, -7.5);
    this.group.add(dais);

    // Guild Banner hanging from North wall
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), bannerMat);
    banner.position.set(0, 3.6, -8.75);
    this.group.add(banner);

    // Mounted Horn Trophy on Wall
    const trophyShield = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.12), daisMat);
    trophyShield.position.set(0, 4.2, -8.65);
    this.group.add(trophyShield);

    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 8), hornMat);
    hornL.position.set(-0.35, 4.2, -8.5);
    hornL.rotation.z = -0.6;
    this.group.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 8), hornMat);
    hornR.position.set(0.35, 4.2, -8.5);
    hornR.rotation.z = 0.6;
    this.group.add(hornR);

    // Grand Interactive Bounty Board on Dais
    const noticeBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.12), daisMat);
    noticeBoard.position.set(0, 1.8, -8.6);
    this.group.add(noticeBoard);

    const parchment = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.2), parchmentMat);
    parchment.position.set(0, 1.8, -8.52);
    this.group.add(parchment);
  }

  private buildAnimatedExitDoor(): void {
    // Grand Arched Interior Door (at South Wall, local z = 8.9)
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a2213, roughness: 0.8 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.35 });
    const doorwayGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe6a3,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8
    });

    this.disposables.push(timberDarkMat, ironMat, doorwayGlowMat);

    // Heavy Stone Door Frame
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 0.4), timberDarkMat);
    doorFrame.position.set(0, 1.8, 8.8);
    this.group.add(doorFrame);

    // Hinge Pivot Group (Pivoting at left jamb x = -0.95)
    this.doorHingeGroup = new THREE.Group();
    this.doorHingeGroup.position.set(-0.95, 0.1, 8.8);

    // Door Leaf Mesh (Shifted +0.95 so it pivots on its left edge!)
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.2, 0.16), timberDarkMat);
    doorLeaf.position.set(0.95, 1.6, 0);
    doorLeaf.castShadow = true;
    this.doorHingeGroup.add(doorLeaf);

    // Iron Band Hinges & Ring Knocker
    [-0.8, 0.8].forEach(hy => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.22), ironMat);
      strap.position.set(0.7, 1.6 + hy, 0);
      this.doorHingeGroup.add(strap);
    });

    const ironRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 12), ironMat);
    ironRing.position.set(1.5, 1.6, 0.1);
    this.doorHingeGroup.add(ironRing);

    this.group.add(this.doorHingeGroup);
  }

  /**
   * Updates interior animations:
   * 1. Dynamic exit door hinge swing when player approaches south exit
   * 2. Flickering fireplace warm illumination
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Calculate distance to interior exit door (Center x = -14, z = 26.8 in world)
    const exitDoorWorldPos = new THREE.Vector3(GuildTavernInterior.CENTER_X, GuildTavernInterior.FLOOR_Y + 1.6, GuildTavernInterior.CENTER_Z + 8.8);
    const distToExit = playerPosition.distanceTo(exitDoorWorldPos);

    // Hysteresis Door Swing: Open when dist <= 2.8m, close when dist >= 3.8m
    let targetAngle = 0; // Closed (0 rad)
    if (distToExit <= 2.8 && playerPosition.z >= GuildTavernInterior.CENTER_Z + 4.5) {
      targetAngle = Math.PI * 0.48; // Swing smoothly open outward/inward (~86 deg)
    }

    // Smooth lerp damping
    this.doorRotation = THREE.MathUtils.lerp(this.doorRotation, targetAngle, Math.min(1.0, deltaTime * 6.0));
    this.doorHingeGroup.rotation.y = this.doorRotation;

    // Fireplace warm ember flicker
    if (this.fireplaceLight) {
      const flicker = 1.9 + Math.sin(Date.now() * 0.008) * 0.25 + (Math.random() - 0.5) * 0.15;
      this.fireplaceLight.intensity = flicker;
    }
  }

  public isExitDoorOpen(): boolean {
    return Math.abs(this.doorRotation) > 0.4;
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
