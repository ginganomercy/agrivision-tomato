import * as THREE from 'three';

export interface Butterfly {
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

export interface FloraFaunaResult {
  group: THREE.Group;
  butterflies: Butterfly[];
  cloudsGroup: THREE.Group;
  particlePoints: THREE.Points;
  particlePositions: Float32Array;
}

/**
 * FloraFaunaBuilder
 * Constructs organic botanical zones & animated atmosphere:
 * 1. Commercial Trellis Rows (East Orchard)
 * 2. Wildflower Pollinator Sanctuary (West)
 * 3. Stone Pathways connecting all zones
 * 4. Perimeter Pine Forest
 * 5. Animated Fluttering Butterflies
 * 6. Low-Poly Drifting Sky Clouds
 * 7. Atmospheric Golden Spore Particles
 */
export class FloraFaunaBuilder {
  public static readonly PARTICLE_COUNT = 240;

  public static build(
    disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[],
    getTerrainHeight: (x: number, z: number) => number
  ): FloraFaunaResult {
    const group = new THREE.Group();

    // 1. Commercial Trellis Rows
    const trellisGroup = new THREE.Group();
    trellisGroup.position.set(35, 0, -32);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.85 });
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.3 });
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x22781b, roughness: 0.7 });
    const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xe01c1c, roughness: 0.3 });
    disposables.push(postMat, wireMat, vineMat, tomatoMat);

    const rowSpacing = 4.2;
    const rowLength = 32.0;

    for (let r = -2; r <= 3; r++) {
      const zOffset = r * rowSpacing;

      [-rowLength / 2, 0, rowLength / 2].forEach(x => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 0.16), postMat);
        post.position.set(x, 1.25, zOffset);
        post.castShadow = true;
        trellisGroup.add(post);
      });

      const wire = new THREE.Mesh(new THREE.BoxGeometry(rowLength, 0.03, 0.03), wireMat);
      wire.position.set(0, 2.3, zOffset);
      trellisGroup.add(wire);

      const vineSegments = 8;
      for (let s = 0; s < vineSegments; s++) {
        const xPos = -rowLength / 2 + (s + 0.5) * (rowLength / vineSegments);

        const vineCluster = new THREE.Mesh(new THREE.SphereGeometry(0.65, 6, 6), vineMat);
        vineCluster.position.set(xPos, 1.4 + (s % 2) * 0.3, zOffset);
        vineCluster.scale.set(0.8, 1.6, 0.8);
        vineCluster.castShadow = true;
        trellisGroup.add(vineCluster);

        [[-0.2, 0.8], [0.2, 1.0], [0, 0.6]].forEach(([dx, dy]) => {
          const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), tomatoMat);
          tomato.position.set(xPos + dx, dy, zOffset + 0.35);
          trellisGroup.add(tomato);
        });
      }
    }
    group.add(trellisGroup);

    // 2. Wildflower Pollinator Sanctuary
    const sanctuaryGroup = new THREE.Group();
    sanctuaryGroup.position.set(-35, 0, -35);

    const lavenderMat = new THREE.MeshStandardMaterial({ color: 0x9370db, roughness: 0.6 });
    const sunflowerMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 });
    const daisyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    disposables.push(lavenderMat, sunflowerMat, daisyMat);

    for (let i = 0; i < 40; i++) {
      const lx = (Math.random() - 0.5) * 34;
      const lz = (Math.random() - 0.5) * 34;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 4), lavenderMat);
      stalk.position.set(lx, 0.38, lz);
      sanctuaryGroup.add(stalk);
    }

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
    group.add(sanctuaryGroup);

    // 3. Garden Pathways
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x948b7d,
      roughness: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    disposables.push(stoneMat);

    const stoneGeo = new THREE.CylinderGeometry(0.75, 0.82, 0.05, 8);
    disposables.push(stoneGeo);

    const createPath = (points: THREE.Vector3[], pointCount = 36) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(pointCount);

      curvePoints.forEach((pt, idx) => {
        const posX = pt.x + (idx % 2 === 0 ? 0.18 : -0.18);
        const posZ = pt.z;

        const distToLake = Math.hypot(posX - (-35), posZ - 35);
        if (distToLake < 20.2 && !(Math.abs(posX - (-35)) < 2.0 && (posZ <= 15.2 || posZ >= 55.5))) {
          return;
        }

        const groundY = getTerrainHeight(posX, posZ);
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.set(posX, groundY + 0.035, posZ);
        stone.rotation.y = idx * 0.72;
        stone.receiveShadow = true;
        group.add(stone);
      });
    };

    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(12, 0, 2),
      new THREE.Vector3(24, 0, -14),
      new THREE.Vector3(35, 0, -28)
    ], 32);

    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(-10, 0, 9.5),
      new THREE.Vector3(-22, 0, 11.5),
      new THREE.Vector3(-35, 0, 14.2)
    ], 30);

    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(14, 0, 16),
      new THREE.Vector3(25, 1.8, 27),
      new THREE.Vector3(34.2, 4.1, 36.2)
    ], 34);

    createPath([
      new THREE.Vector3(0, 0, 7.5),
      new THREE.Vector3(-12, 0, -6),
      new THREE.Vector3(-24, 0, -18),
      new THREE.Vector3(-35, 0, -32)
    ], 32);

    createPath([
      new THREE.Vector3(-35, 0, 13.5),
      new THREE.Vector3(-24, 0, 16.0),
      new THREE.Vector3(-14, 0, 26.0),
      new THREE.Vector3(-13, 0, 38.0),
      new THREE.Vector3(-17, 0, 49.0)
    ], 36);

    createPath([
      new THREE.Vector3(-35, 0, 56.5),
      new THREE.Vector3(-28, 0, 61.0),
      new THREE.Vector3(-16, 0, 64.0),
      new THREE.Vector3(0, 0, 62.0)
    ], 28);

    // 4. Perimeter Pine Forest — InstancedMesh (168 draw calls → 4, pixel-perfect identical visual)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3221, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x1b4d18, roughness: 0.75 });
    disposables.push(trunkMat, pineMat);

    const TREE_COUNT = 42;
    const FOREST_RADIUS = 78.0;

    // Shared geometry (created once, reused across all instances)
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.6, 7);
    const foliageTiers = [
      { r: 2.2, h: 3.2, yOff: 3.9 },
      { r: 1.7, h: 2.8, yOff: 5.7 },
      { r: 1.1, h: 2.2, yOff: 7.3 }
    ];
    const foliageGeos = foliageTiers.map(t => new THREE.ConeGeometry(t.r, t.h, 7));
    disposables.push(trunkGeo, ...foliageGeos);

    // One InstancedMesh per geometry type → 4 total draw calls for 42 trees
    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_COUNT);
    const foliageInstanced = foliageTiers.map((_, i) =>
      new THREE.InstancedMesh(foliageGeos[i], pineMat, TREE_COUNT)
    );
    trunkInstanced.castShadow = true;
    foliageInstanced.forEach(fi => { fi.castShadow = true; });

    // Static objects — disable per-frame matrix recalculation (zero visual change)
    trunkInstanced.matrixAutoUpdate = false;
    foliageInstanced.forEach(fi => { fi.matrixAutoUpdate = false; });

    const dummy = new THREE.Object3D();

    for (let t = 0; t < TREE_COUNT; t++) {
      const angle = (t / TREE_COUNT) * Math.PI * 2;
      const tx = Math.cos(angle) * (FOREST_RADIUS + (t % 3) * 4);
      const tz = Math.sin(angle) * (FOREST_RADIUS + (t % 3) * 4);
      const treeGroundY = getTerrainHeight(tx, tz) - 0.25;

      // Trunk instance
      dummy.position.set(tx, treeGroundY + 1.8, tz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(t, dummy.matrix);

      // Foliage tier instances
      foliageTiers.forEach((tier, ti) => {
        dummy.position.set(tx, treeGroundY + tier.yOff, tz);
        dummy.rotation.set(0, (t * 0.618) % (Math.PI * 2), 0); // subtle yaw variation per tree
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        foliageInstanced[ti].setMatrixAt(t, dummy.matrix);
      });
    }

    trunkInstanced.instanceMatrix.needsUpdate = true;
    foliageInstanced.forEach(fi => { fi.instanceMatrix.needsUpdate = true; });

    group.add(trunkInstanced, ...foliageInstanced);


    // 5. Animated Butterflies
    const wingMatMonarch = new THREE.MeshBasicMaterial({ color: 0xff6b35, side: THREE.DoubleSide });
    const wingMatMorpho = new THREE.MeshBasicMaterial({ color: 0x00b4d8, side: THREE.DoubleSide });
    disposables.push(wingMatMonarch, wingMatMorpho);

    const wingGeo = new THREE.PlaneGeometry(0.22, 0.32);
    wingGeo.translate(0.11, 0, 0);
    disposables.push(wingGeo);

    const butterflies: Butterfly[] = [];

    for (let b = 0; b < 8; b++) {
      const bGroup = new THREE.Group();
      const mat = b % 2 === 0 ? wingMatMonarch : wingMatMorpho;

      const wingL = new THREE.Mesh(wingGeo, mat);
      const wingR = new THREE.Mesh(wingGeo, mat);
      wingR.rotation.y = Math.PI;

      bGroup.add(wingL);
      bGroup.add(wingR);

      const angle = (b / 8) * Math.PI * 2;
      const dist = 5.0 + (b % 4) * 3.5;
      const baseX = -35 + Math.cos(angle) * dist;
      const baseZ = -35 + Math.sin(angle) * dist;
      const baseY = 1.3 + (b % 3) * 0.35;

      bGroup.position.set(baseX, baseY, baseZ);
      group.add(bGroup);

      butterflies.push({
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

    // 6. Sky Clouds
    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    disposables.push(cloudMat);

    const cloudPuffs = 12;
    for (let c = 0; c < cloudPuffs; c++) {
      const cloud = new THREE.Group();
      const cx = (Math.random() - 0.5) * 160;
      const cy = 40 + Math.random() * 12;
      const cz = (Math.random() - 0.5) * 160;

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
      cloudsGroup.add(cloud);
    }
    group.add(cloudsGroup);

    // 7. Atmospheric Particles
    const geo = new THREE.BufferGeometry();
    const count = FloraFaunaBuilder.PARTICLE_COUNT;
    const particlePositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 8.0;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    disposables.push(geo);

    const mat = new THREE.PointsMaterial({
      color: 0xffe89e,
      size: 0.16,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    disposables.push(mat);

    const particlePoints = new THREE.Points(geo, mat);
    group.add(particlePoints);

    return {
      group,
      butterflies,
      cloudsGroup,
      particlePoints,
      particlePositions
    };
  }

  public static update(
    deltaTime: number,
    elapsedTime: number,
    butterflies: Butterfly[],
    cloudsGroup: THREE.Group,
    particlePoints: THREE.Points,
    particlePositions: Float32Array
  ): void {
    // 1. Butterflies
    butterflies.forEach(b => {
      const flightTime = elapsedTime * b.speed + b.phase;
      const curX = b.baseX + Math.sin(flightTime) * b.radius;
      const curZ = b.baseZ + Math.cos(flightTime * 0.8) * b.radius;
      const curY = b.baseY + Math.sin(flightTime * 2.0) * 0.6;

      b.group.position.set(curX, curY, curZ);
      b.group.rotation.y = Math.atan2(Math.cos(flightTime), -Math.sin(flightTime * 0.8));

      const flapAngle = Math.sin(elapsedTime * 24.0 + b.phase) * 0.85;
      b.wingLeft.rotation.y = flapAngle;
      b.wingRight.rotation.y = Math.PI - flapAngle;
    });

    // 2. Clouds
    cloudsGroup.children.forEach(cloud => {
      cloud.position.x += deltaTime * 0.8;
      if (cloud.position.x > 90) cloud.position.x = -90;
    });

    // 3. Spore Particles
    if (particlePoints) {
      const pos = particlePositions;
      const count = FloraFaunaBuilder.PARTICLE_COUNT;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 0] += Math.sin(pos[i * 3 + 1] * 0.4) * 0.3 * deltaTime;
        pos[i * 3 + 1] += Math.cos(pos[i * 3 + 0] * 0.4) * 0.2 * deltaTime;

        if (pos[i * 3 + 1] > 8.0) pos[i * 3 + 1] = 0.5;
        if (pos[i * 3 + 1] < 0.3) pos[i * 3 + 1] = 7.8;
      }
      particlePoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}
