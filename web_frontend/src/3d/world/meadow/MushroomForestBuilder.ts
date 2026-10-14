import * as THREE from 'three';

/**
 * MushroomForestBuilder
 * Constructs the Far West Hutan Jamur Misterius zone (x∈[-100,-60], z∈[-20,40])
 * Features: 50+ procedural mushrooms (small/medium/large), ancient oak trees,
 * glowing purple/blue spore particles, cave entrance with glow, luminescent ground patches,
 * twisted roots, hanging moss strips — deeply mystical palette (deep purple, dark green, teal).
 * Zone center: (-80, 0, 10)
 */
export class MushroomForestBuilder {
  public static build(
    disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(-80, 0, 10); // zone center

    // ─── Shared Materials ───
    const mushroomCapColors = [0xcc44aa, 0x8833cc, 0xff6633, 0x3399cc, 0xcc2222, 0xffcc44];
    const mushroomStemMat = new THREE.MeshStandardMaterial({
      color: 0xf0e8dc,
      roughness: 0.8
    });
    const groundGlowMat = new THREE.MeshStandardMaterial({
      color: 0x220044,
      emissive: 0x440088,
      emissiveIntensity: 0.6,
      roughness: 0.9,
      transparent: true,
      opacity: 0.75
    });
    const oakTrunkMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, roughness: 0.95 });
    const oakFoliageMat = new THREE.MeshStandardMaterial({ color: 0x0d2e18, roughness: 0.8 });
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x1a4d1a,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const caveRockMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.95 });
    const caveGlowMat = new THREE.MeshStandardMaterial({
      color: 0x6600ff,
      emissive: 0x4400cc,
      emissiveIntensity: 2.0,
      roughness: 0.2
    });
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x3d2011, roughness: 0.92 });

    // Cache cap materials to share
    const capMaterials = mushroomCapColors.map(c => {
      const m = new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.6,
        emissive: c,
        emissiveIntensity: 0.12
      });
      disposables.push(m);
      return m;
    });

    disposables.push(
      mushroomStemMat, groundGlowMat, oakTrunkMat,
      oakFoliageMat, mossMat, caveRockMat, caveGlowMat, rootMat
    );

    // ─── 1. Procedural Mushrooms — InstancedMesh per cap-color (165 draw calls → 18) ───
    type MushroomDef = { x: number; z: number; scale: number; capIdx: number; tilt: number };

    // Deterministic pseudo-random placement using golden angle
    const mushrooms: MushroomDef[] = [];
    for (let i = 0; i < 55; i++) {
      const angle = i * 2.399;
      const r = 3.5 + (i % 7) * 3.2;
      const x = Math.cos(angle) * r + Math.sin(i * 0.8) * 2.5;
      const z = Math.sin(angle) * r + Math.cos(i * 0.6) * 2.5;
      if (Math.hypot(x - 14, z - 8) < 4) continue;
      mushrooms.push({
        x: Math.max(-18, Math.min(18, x)),
        z: Math.max(-18, Math.min(18, z)),
        scale: 0.4 + (i % 5) * 0.35,
        capIdx: i % mushroomCapColors.length,
        tilt: Math.sin(i * 1.3) * 0.15
      });
    }

    // Group mushrooms by cap color for instancing
    const byColor: MushroomDef[][] = mushroomCapColors.map(() => []);
    mushrooms.forEach(m => byColor[m.capIdx].push(m));

    // Shared gill materials — one per cap color (not one per mushroom)
    const gillMats = mushroomCapColors.map((c) => {
      const m = new THREE.MeshStandardMaterial({
        color: c, emissive: c, emissiveIntensity: 0.08,
        side: THREE.BackSide, roughness: 0.85
      });
      disposables.push(m);
      return m;
    });

    const dummyM = new THREE.Object3D();

    byColor.forEach((group_mushrooms, colorIdx) => {
      if (group_mushrooms.length === 0) return;
      const capMat = capMaterials[colorIdx];
      const count = group_mushrooms.length;

      // Representative geometry (scale handled via matrix)
      const stemGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.7, 6);
      const capGeo = new THREE.SphereGeometry(0.38, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
      const gillGeo = new THREE.CylinderGeometry(0.34, 0.095, 0.32, 8, 1, true);
      disposables.push(stemGeo, capGeo, gillGeo);

      const stemIM = new THREE.InstancedMesh(stemGeo, mushroomStemMat, count);
      const capIM = new THREE.InstancedMesh(capGeo, capMat, count);
      const gillIM = new THREE.InstancedMesh(gillGeo, gillMats[colorIdx], count);

      // Static mushrooms — no per-frame matrix update
      stemIM.matrixAutoUpdate = false;
      capIM.matrixAutoUpdate = false;
      gillIM.matrixAutoUpdate = false;

      group_mushrooms.forEach(({ x, z, scale, tilt }, i) => {
        const stemH = 0.4 * scale + 0.3;
        const capR = 0.55 * scale + 0.2;

        // Stem
        dummyM.position.set(x, stemH / 2, z);
        dummyM.rotation.set(0, 0, tilt);
        dummyM.scale.set(capR / 0.38, stemH / 0.7, capR / 0.38);
        dummyM.updateMatrix();
        stemIM.setMatrixAt(i, dummyM.matrix);

        // Cap dome
        dummyM.position.set(x + Math.sin(tilt) * stemH * 0.5, stemH, z);
        dummyM.rotation.set(0, 0, 0);
        dummyM.scale.set(capR / 0.38, capR / 0.38, capR / 0.38);
        dummyM.updateMatrix();
        capIM.setMatrixAt(i, dummyM.matrix);

        // Gills (underside)
        dummyM.position.set(x + Math.sin(tilt) * stemH * 0.5, stemH - 0.16, z);
        dummyM.rotation.set(0, 0, 0);
        dummyM.scale.set(capR / 0.38, capR / 0.38, capR / 0.38);
        dummyM.updateMatrix();
        gillIM.setMatrixAt(i, dummyM.matrix);
      });

      stemIM.instanceMatrix.needsUpdate = true;
      capIM.instanceMatrix.needsUpdate = true;
      gillIM.instanceMatrix.needsUpdate = true;

      group.add(stemIM, capIM, gillIM);
    });


    // ─── 2. Ancient Oak Trees (8 wide gnarly trees) ───
    const oakPositions: [number, number][] = [
      [-16, -14], [15, -12], [-14, 15], [14, 14],
      [-8, -16], [9, -15], [-16, 4], [16, 6]
    ];
    oakPositions.forEach(([ox, oz]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(ox, 0, oz);

      // Gnarled thick trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 4.5, 8),
        oakTrunkMat
      );
      trunk.position.y = 2.25;
      trunk.rotation.z = (Math.random() - 0.5) * 0.12;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Main foliage clusters (3 tiers)
      [
        { r: 3.2, h: 3.0, y: 5.8 },
        { r: 2.4, h: 2.4, y: 7.8 },
        { r: 1.5, h: 1.8, y: 9.2 }
      ].forEach(tier => {
        const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(tier.r, 7, 5),
          oakFoliageMat
        );
        foliage.position.set((Math.random() - 0.5) * 0.5, tier.y, (Math.random() - 0.5) * 0.5);
        foliage.scale.set(1.1, 0.85, 1.05);
        foliage.castShadow = true;
        treeGroup.add(foliage);
      });

      // Twisted surface root (box)
      [0, Math.PI / 2, -Math.PI / 3].forEach(angle => {
        const root = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.3, 1.6),
          rootMat
        );
        root.position.set(
          Math.cos(angle) * 0.8,
          0.12,
          Math.sin(angle) * 0.8
        );
        root.rotation.y = angle + 0.3;
        treeGroup.add(root);
      });

      // Hanging moss strips
      for (let m = 0; m < 4; m++) {
        const mossStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(0.25, 1.2 + Math.random() * 0.8),
          mossMat
        );
        mossStrip.position.set(
          (Math.random() - 0.5) * 3,
          5.5 + Math.random() * 1.5,
          (Math.random() - 0.5) * 3
        );
        mossStrip.rotation.y = Math.random() * Math.PI;
        treeGroup.add(mossStrip);
      }

      group.add(treeGroup);
    });

    // ─── 3. Cave Entrance (East edge of zone, portal marker) ───
    const caveX = 14;
    const caveZ = 8;

    // Cave mouth rocky frame (3 boulders forming arch)
    const boulderSizes: [number, number, number, number, number, number][] = [
      [caveX - 1.5, 1.4, caveZ, 2.2, 2.8, 1.5],
      [caveX + 1.5, 1.4, caveZ, 2.2, 2.8, 1.5],
      [caveX, 2.9, caveZ, 3.2, 0.9, 1.2]
    ];
    boulderSizes.forEach(([bx, by, bz, sw, sh, sd]) => {
      const boulder = new THREE.Mesh(
        new THREE.BoxGeometry(sw, sh, sd),
        caveRockMat
      );
      boulder.position.set(bx, by, bz);
      boulder.castShadow = true;
      group.add(boulder);
    });

    // Cave inner glow (visible through opening)
    const caveGlow = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 8),
      caveGlowMat
    );
    caveGlow.position.set(caveX, 1.4, caveZ + 0.72);
    caveGlow.rotation.y = Math.PI;
    group.add(caveGlow);

    // Cave point light
    const caveLight = new THREE.PointLight(0x7722ff, 2.5, 14, 1.5);
    caveLight.position.set(caveX, 1.8, caveZ + 1);
    group.add(caveLight);

    // Glowing mushroom cluster at cave entrance
    [[caveX - 2, caveZ - 0.8], [caveX + 2.2, caveZ - 0.5]].forEach(([gx, gz]) => {
      const g = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: 0x9933ff,
          emissive: 0x6611cc,
          emissiveIntensity: 1.4
        })
      );
      g.position.set(gx, 0.48, gz);
      group.add(g);
    });

    // ─── 4. Luminescent Ground Patches ───
    const glowPatches: [number, number][] = [
      [0, 0], [-8, 6], [6, -8], [-4, -10], [10, 10], [-12, -2]
    ];
    glowPatches.forEach(([gx, gz]) => {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(1.4 + Math.random() * 0.8, 8),
        groundGlowMat
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(gx, 0.02, gz);
      group.add(patch);
    });

    // ─── 5. Atmospheric Spore Particle System ───
    const SPORE_COUNT = 180;
    const sporePositions = new Float32Array(SPORE_COUNT * 3);
    for (let i = 0; i < SPORE_COUNT; i++) {
      sporePositions[i * 3 + 0] = (Math.random() - 0.5) * 38;
      sporePositions[i * 3 + 1] = 0.3 + Math.random() * 6.0;
      sporePositions[i * 3 + 2] = (Math.random() - 0.5) * 38;
    }
    const sporeGeo = new THREE.BufferGeometry();
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
    disposables.push(sporeGeo);

    const sporeMat = new THREE.PointsMaterial({
      color: 0xaa44ff,
      size: 0.14,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    disposables.push(sporeMat);

    const sporePoints = new THREE.Points(sporeGeo, sporeMat);
    group.add(sporePoints);

    return group;
  }
}
