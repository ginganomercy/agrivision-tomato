/**
 * BotanicalMeadow - Expansive Lush Natural Meadow Environment ("Hamparan Lapangan Hijau")
 * 90m x 90m terrain with garden pathway, perimeter hills, rustic wooden fence,
 * tomato shrubs, wildflowers, and drifting golden spore particles.
 */
import * as THREE from 'three';

export class BotanicalMeadow {
  private group: THREE.Group;
  private particlePoints!: THREE.Points;
  private particlePositions!: Float32Array;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  public static readonly MEADOW_SIZE = 90; // 90x90 meters
  private static readonly PARTICLE_COUNT = 120;

  constructor() {
    this.group = new THREE.Group();
    this.buildTerrain();
    this.buildGardenPathway();
    this.buildPerimeterFences();
    this.buildTomatoBushesAndFlowers();
    this.buildAtmosphericParticles();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  private buildTerrain(): void {
    // 90m terrain with gentle rolling perimeter hills
    const segs = 48;
    const terrainGeo = new THREE.PlaneGeometry(BotanicalMeadow.MEADOW_SIZE, BotanicalMeadow.MEADOW_SIZE, segs, segs);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Keep central area (inside and near greenhouse) flat
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter > 18) {
        // Rolling mounds towards outer boundary
        const hill = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.4;
        const outerRise = Math.pow(Math.max(0, distFromCenter - 25) / 20, 2) * 3.5;
        pos.setY(i, hill + outerRise);
      } else {
        // Depress terrain under greenhouse footprint to -0.06m to eliminate coplanar z-fighting
        if (Math.abs(x) < 10.5 && Math.abs(z) < 8.5) {
          pos.setY(i, -0.06);
        } else {
          pos.setY(i, 0);
        }
      }
    }
    terrainGeo.computeVertexNormals();
    this.disposables.push(terrainGeo);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x338f28, // Lush natural meadow green
      roughness: 0.85,
      metalness: 0.02
    });
    this.disposables.push(grassMat);

    const terrainMesh = new THREE.Mesh(terrainGeo, grassMat);
    terrainMesh.receiveShadow = true;
    this.group.add(terrainMesh);
  }

  private buildGardenPathway(): void {
    // Winding stone path leading south from the greenhouse portal (z = 7 to z = 28)
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 7.0),
      new THREE.Vector3(0.5, 0.02, 12.0),
      new THREE.Vector3(-0.8, 0.02, 18.0),
      new THREE.Vector3(0.2, 0.02, 25.0),
      new THREE.Vector3(1.2, 0.02, 32.0)
    ]);

    const pathPoints = pathCurve.getPoints(24);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8479, roughness: 0.9 });
    this.disposables.push(stoneMat);

    pathPoints.forEach((pt, idx) => {
      const stoneGeo = new THREE.CylinderGeometry(0.7 + (idx % 3) * 0.15, 0.75, 0.04, 7);
      this.disposables.push(stoneGeo);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(pt.x + ((idx % 2 === 0 ? 0.2 : -0.2)), 0.03, pt.z);
      stone.rotation.y = (idx * 0.8);
      stone.receiveShadow = true;
      this.group.add(stone);
    });
  }

  private buildPerimeterFences(): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
    this.disposables.push(woodMat);

    const halfSize = BotanicalMeadow.MEADOW_SIZE / 2 - 3;
    const postGeo = new THREE.BoxGeometry(0.18, 1.4, 0.18);
    const railGeo = new THREE.BoxGeometry(3.0, 0.1, 0.08);
    this.disposables.push(postGeo, railGeo);

    // Fence segments around perimeter bounds
    const createFenceLine = (startX: number, startZ: number, endX: number, endZ: number) => {
      const dist = Math.hypot(endX - startX, endZ - startZ);
      const steps = Math.floor(dist / 3.0);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = startX + (endX - startX) * t;
        const z = startZ + (endZ - startZ) * t;

        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(x, 0.7, z);
        post.castShadow = true;
        this.group.add(post);

        if (i < steps) {
          const nextX = startX + (endX - startX) * ((i + 1) / steps);
          const nextZ = startZ + (endZ - startZ) * ((i + 1) / steps);
          const midX = (x + nextX) / 2;
          const midZ = (z + nextZ) / 2;
          const angle = Math.atan2(nextZ - z, nextX - x);

          const railTop = new THREE.Mesh(railGeo, woodMat);
          railTop.position.set(midX, 1.0, midZ);
          railTop.rotation.y = -angle;
          this.group.add(railTop);

          const railBot = new THREE.Mesh(railGeo, woodMat);
          railBot.position.set(midX, 0.5, midZ);
          railBot.rotation.y = -angle;
          this.group.add(railBot);
        }
      }
    };

    // Four boundaries
    createFenceLine(-halfSize, -halfSize, halfSize, -halfSize);
    createFenceLine(halfSize, -halfSize, halfSize, halfSize);
    createFenceLine(halfSize, halfSize, -halfSize, halfSize);
    createFenceLine(-halfSize, halfSize, -halfSize, -halfSize);
  }

  private buildTomatoBushesAndFlowers(): void {
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x1e6616, roughness: 0.8 });
    const cherryMat = new THREE.MeshStandardMaterial({ color: 0xe61f1f, roughness: 0.3 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffe83b, roughness: 0.4 });
    const daisyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    this.disposables.push(bushMat, cherryMat, flowerMat, daisyMat);

    // Tomato Bush clusters outside the greenhouse
    const bushLocations = [
      [-12, 10], [14, 12], [-16, 20], [18, 22],
      [-8, 26], [9, 28], [-22, 5], [24, 7],
      [-15, -12], [16, -14], [-4, 34], [6, 36]
    ];

    bushLocations.forEach(([bx, bz]) => {
      const bushGroup = new THREE.Group();
      bushGroup.position.set(bx, 0, bz);

      // 3 spherical leaf clusters
      [[-0.3, 0.5, 0], [0.3, 0.6, 0.2], [0, 0.8, -0.2]].forEach(([ox, oy, oz]) => {
        const leafMesh = new THREE.Mesh(new THREE.SphereGeometry(0.65, 7, 6), bushMat);
        leafMesh.position.set(ox, oy, oz);
        leafMesh.castShadow = true;
        bushGroup.add(leafMesh);
      });

      // Hanging cherry tomatoes
      [[-0.4, 0.4, 0.5], [0.3, 0.5, 0.6], [0.1, 0.3, -0.4]].forEach(([tx, ty, tz]) => {
        const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), cherryMat);
        cherry.position.set(tx, ty, tz);
        bushGroup.add(cherry);
      });

      // Yellow blossoms
      [[0.2, 0.9, 0.1], [-0.2, 0.8, 0.3]].forEach(([fx, fy, fz]) => {
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.05, 5), flowerMat);
        fl.position.set(fx, fy, fz);
        bushGroup.add(fl);
      });

      this.group.add(bushGroup);
    });

    // Chamomile / Daisy wildflowers scattered randomly in grass
    for (let i = 0; i < 45; i++) {
      const angle = (i / 45) * Math.PI * 2;
      const r = 12 + (i % 5) * 5.5;
      const fx = Math.cos(angle) * r;
      const fz = Math.sin(angle) * r;

      // Avoid inside greenhouse area
      if (Math.abs(fx) < 10 && Math.abs(fz) < 8) continue;

      const daisy = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), daisyMat);
      daisy.rotation.x = -Math.PI / 2;
      daisy.position.set(fx, 0.1, fz);
      this.group.add(daisy);
    }
  }

  private buildAtmosphericParticles(): void {
    const geo = new THREE.BufferGeometry();
    const count = BotanicalMeadow.PARTICLE_COUNT;
    this.particlePositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 70;
      this.particlePositions[i * 3 + 1] = 0.5 + Math.random() * 5.5;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.disposables.push(geo);

    const mat = new THREE.PointsMaterial({
      color: 0xfff4c2, // Golden dandelion fluff / pollen
      size: 0.14,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.disposables.push(mat);

    this.particlePoints = new THREE.Points(geo, mat);
    this.group.add(this.particlePoints);
  }

  public updateParticles(deltaTime: number): void {
    if (!this.particlePoints) return;
    const pos = this.particlePositions;
    const count = BotanicalMeadow.PARTICLE_COUNT;

    for (let i = 0; i < count; i++) {
      // Gentle drift along X and upward wave
      pos[i * 3 + 0] += Math.sin(pos[i * 3 + 1] * 0.5) * 0.2 * deltaTime;
      pos[i * 3 + 1] += Math.cos(pos[i * 3 + 0] * 0.5) * 0.15 * deltaTime;

      // Wrap if drifted too high or low
      if (pos[i * 3 + 1] > 6.0) pos[i * 3 + 1] = 0.5;
      if (pos[i * 3 + 1] < 0.4) pos[i * 3 + 1] = 5.8;
    }

    this.particlePoints.geometry.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
