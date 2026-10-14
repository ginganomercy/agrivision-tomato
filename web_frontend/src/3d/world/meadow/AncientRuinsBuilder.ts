import * as THREE from 'three';

/**
 * AncientRuinsBuilder
 * Constructs the North Ancient Agricultural Ruins zone (x∈[-25,25], z∈[-80,-50])
 * Features: Stone pillars, crumbling arch gateway, moss-covered altar with glowing rune crystal,
 * scattered rubble, ivy-covered walls, mysterious rune stones — all in dark mossy palette.
 * Zone center: (0, 0, -65)
 */
export class AncientRuinsBuilder {
  public static build(
    disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
  ): THREE.Group {
    const group = new THREE.Group();
    // Zone centered at world (0, 0, -65)
    group.position.set(0, 0, -65);

    // — Shared Materials —
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x6b6560,
      roughness: 0.95,
      metalness: 0.02
    });
    const mossStoneMat = new THREE.MeshStandardMaterial({
      color: 0x4a5e3a,
      roughness: 0.92,
      metalness: 0.0
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x3a3630,
      roughness: 0.97,
      metalness: 0.0
    });
    const runeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x88ffcc,
      emissive: 0x33ffaa,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1
    });
    const ivyMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a1b,
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    disposables.push(stoneMat, mossStoneMat, darkStoneMat, runeGlowMat, ivyMat);

    // ─── 1. Grand Arch Gateway (entrance, z = -11) ───
    const archBase = [
      { x: -4.5 }, { x: 4.5 } // two pillars
    ];
    archBase.forEach(({ x }) => {
      // Main pillar
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, 5.5, 8),
        stoneMat
      );
      pillar.position.set(x, 2.75, -11);
      pillar.castShadow = true;
      group.add(pillar);

      // Capital (top block)
      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.55, 1.4),
        mossStoneMat
      );
      capital.position.set(x, 5.78, -11);
      group.add(capital);

      // Crumbled base rubble
      for (let r = 0; r < 4; r++) {
        const rubble = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.25 + Math.random() * 0.35,
            0.15 + Math.random() * 0.2,
            0.25 + Math.random() * 0.3
          ),
          darkStoneMat
        );
        rubble.position.set(
          x + (Math.random() - 0.5) * 1.4,
          0.12,
          -11 + (Math.random() - 0.5) * 1.5
        );
        rubble.rotation.y = Math.random() * Math.PI;
        group.add(rubble);
      }
    });

    // Broken arch lintel (partial span, tilted)
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.5, 0.55),
      mossStoneMat
    );
    lintel.position.set(-1.5, 5.9, -11);
    lintel.rotation.z = 0.08; // slightly collapsed
    lintel.castShadow = true;
    group.add(lintel);

    // ─── 2. Four Ancient Stone Pillars (corners of sacred area) ───
    const pillarPositions: [number, number][] = [
      [-8, 3], [8, 3], [-8, -4], [8, -4]
    ];
    pillarPositions.forEach(([px, pz], idx) => {
      // Full intact pillar or partial broken
      const height = idx % 3 === 0 ? 4.2 : 3.0 + (idx % 2) * 0.8;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.5, height, 7),
        stoneMat
      );
      pillar.position.set(px, height / 2, pz);
      pillar.castShadow = true;
      group.add(pillar);

      // Ivy draping on some pillars
      if (idx % 2 === 0) {
        for (let v = 0; v < 3; v++) {
          const ivyPatch = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6 + Math.random() * 0.4, 0.8),
            ivyMat
          );
          ivyPatch.position.set(
            px + (Math.random() - 0.5) * 0.6,
            1.0 + v * 0.9,
            pz + 0.42
          );
          ivyPatch.rotation.y = Math.random() * Math.PI * 0.3;
          group.add(ivyPatch);
        }
      }
    });

    // ─── 3. Central Sacred Altar Platform ───
    // Altar base slab
    const altarBase = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.4, 3.2),
      darkStoneMat
    );
    altarBase.position.set(0, 0.2, 0);
    altarBase.castShadow = true;
    altarBase.receiveShadow = true;
    group.add(altarBase);

    // Altar table stone
    const altarTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.35, 1.8),
      mossStoneMat
    );
    altarTable.position.set(0, 0.58, 0);
    altarTable.castShadow = true;
    group.add(altarTable);

    // Glowing Crystal on altar
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1.2, 6),
      runeGlowMat
    );
    crystal.position.set(0, 1.35, 0);
    crystal.rotation.y = Math.PI / 6;
    group.add(crystal);

    // Crystal inverse (double cone)
    const crystalBottom = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.7, 6),
      runeGlowMat
    );
    crystalBottom.position.set(0, 0.75, 0);
    crystalBottom.rotation.z = Math.PI;
    group.add(crystalBottom);

    // Crystal Point Light
    const crystalLight = new THREE.PointLight(0x44ffbb, 2.2, 18, 1.5);
    crystalLight.position.set(0, 1.8, 0);
    group.add(crystalLight);

    // ─── 4. Rune Stones (4 inscribed slabs scattered around) ───
    const runePositions: [number, number, number][] = [
      [-14, 0, -6],
      [14, 0, -7],
      [-11, 0, 8],
      [11, 0, 7]
    ];
    runePositions.forEach(([rx, ry, rz]) => {
      const runeSlabGeo = new THREE.BoxGeometry(0.22, 1.8, 1.0);
      disposables.push(runeSlabGeo);
      const runeSlab = new THREE.Mesh(runeSlabGeo, darkStoneMat);
      runeSlab.position.set(rx, ry + 0.9, rz);
      runeSlab.rotation.y = (Math.random() - 0.5) * 0.4;
      runeSlab.castShadow = true;
      group.add(runeSlab);

      // Glowing rune inscription on slab face
      const runeMarkGeo = new THREE.PlaneGeometry(0.5, 1.1);
      disposables.push(runeMarkGeo);
      const runeMark = new THREE.Mesh(runeMarkGeo, new THREE.MeshStandardMaterial({
        color: 0x88ffcc,
        emissive: 0x33ffaa,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.85
      }));
      runeMark.position.set(rx + 0.12, ry + 0.9, rz);
      runeMark.rotation.y = -Math.PI / 2;
      group.add(runeMark);
    });

    // ─── 5. Scattered Rubble Field ───
    const rubbleMat = darkStoneMat;
    for (let i = 0; i < 28; i++) {
      const rx = (Math.random() - 0.5) * 44;
      const rz = (Math.random() - 0.5) * 28;

      // Skip center altar area
      if (Math.abs(rx) < 5 && Math.abs(rz) < 5) continue;

      const size = 0.2 + Math.random() * 0.5;
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * 0.5, size * 0.8),
        rubbleMat
      );
      rubble.position.set(rx, size * 0.2, rz);
      rubble.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.4
      );
      rubble.receiveShadow = true;
      group.add(rubble);
    }

    // ─── 6. Crumbling Wall Segment (West side) ───
    const wallSegments = [
      { x: -14, z: 0, w: 1.2, h: 2.8, d: 0.4, ry: 0 },
      { x: -15, z: -4, w: 0.4, h: 1.6, d: 2.0, ry: 0 },
    ];
    wallSegments.forEach(({ x, z, w, h, d, ry }) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mossStoneMat
      );
      wall.position.set(x, h / 2, z);
      wall.rotation.y = ry;
      wall.castShadow = true;
      group.add(wall);
    });

    // ─── 8. Zone Entry Stone Arch Sign Posts ───
    const signPostGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.2, 6);
    disposables.push(signPostGeo);
    [-2.2, 2.2].forEach(px => {
      const post = new THREE.Mesh(signPostGeo, darkStoneMat);
      post.position.set(px, 1.6, -13.5);
      post.castShadow = true;
      group.add(post);
    });

    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.28, 0.28),
      darkStoneMat
    );
    crossbar.position.set(0, 3.3, -13.5);
    group.add(crossbar);

    return group;
  }
}
