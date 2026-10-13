import * as THREE from 'three';

/**
 * RiceFieldBuilder
 * Constructs the Far East Sawah Irigasi & Sungai Mengalir zone (x∈[60,100], z∈[-20,40])
 * Features: 12 paddy plot rows, irrigation canal/river, mini waterfall, scarecrows,
 * golden rice collectible markers, traditional bamboo fences, oil lamp posts.
 * Zone center: (80, 0, 10)
 */
export class RiceFieldBuilder {
  public static build(
    disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
  ): THREE.Group {
    const group = new THREE.Group();
    // Zone at world Far East — group origin stays at world (0,0,0), objects positioned absolutely
    group.position.set(80, 0, 10); // zone center

    // — Shared Materials —
    const riceMat = new THREE.MeshStandardMaterial({ color: 0x6cb33f, roughness: 0.8 });
    const riceGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.6 });
    const muddyWaterMat = new THREE.MeshStandardMaterial({
      color: 0x4a8a6a,
      roughness: 0.1,
      metalness: 0.08,
      transparent: true,
      opacity: 0.78
    });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.95 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2060a8,
      roughness: 0.05,
      metalness: 0.15,
      transparent: true,
      opacity: 0.80
    });
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0xa8c060, roughness: 0.75 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd4a855, roughness: 0.85 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffdd88,
      emissive: 0xffaa22,
      emissiveIntensity: 1.4
    });
    disposables.push(
      riceMat, riceGoldMat, muddyWaterMat, soilMat,
      waterMat, bambooMat, strawMat, ropeMat, lanternGlowMat
    );

    // ─── 1. Paddy Field Plots (4 columns × 3 rows = 12 plots) ───
    const PLOT_W = 7.0;
    const PLOT_D = 8.0;
    const BERM_W = 0.6;

    // Pre-compute all rice positions to batch into InstancedMesh
    type RicePos = { x: number; y: number; z: number; golden: boolean };
    const ricePositions: RicePos[] = [];
    const RICE_ROWS = 4;
    const RICE_COLS = 5;

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 3; row++) {
        const px = -15 + col * (PLOT_W + BERM_W);
        const pz = -12 + row * (PLOT_D + BERM_W);

        // Flooded paddy water surface (static — disable matrix update)
        const plotWater = new THREE.Mesh(
          new THREE.PlaneGeometry(PLOT_W - 0.1, PLOT_D - 0.1),
          muddyWaterMat
        );
        plotWater.rotation.x = -Math.PI / 2;
        plotWater.position.set(px, -0.04, pz);
        plotWater.matrixAutoUpdate = false;
        plotWater.updateMatrix();
        group.add(plotWater);

        const bermE = new THREE.Mesh(new THREE.BoxGeometry(BERM_W, 0.22, PLOT_D + BERM_W), soilMat);
        bermE.position.set(px + PLOT_W / 2 + BERM_W / 2, 0.11, pz);
        bermE.matrixAutoUpdate = false;
        bermE.updateMatrix();
        group.add(bermE);

        const bermN = new THREE.Mesh(new THREE.BoxGeometry(PLOT_W + BERM_W, 0.22, BERM_W), soilMat);
        bermN.position.set(px, 0.11, pz - PLOT_D / 2 - BERM_W / 2);
        bermN.matrixAutoUpdate = false;
        bermN.updateMatrix();
        group.add(bermN);

        const isGolden = (col === 1 && row === 1) || (col === 3 && row === 0);

        for (let ri = 0; ri < RICE_ROWS; ri++) {
          for (let ci = 0; ci < RICE_COLS; ci++) {
            const rx = px - PLOT_W / 2 + 0.8 + ci * ((PLOT_W - 1.2) / (RICE_COLS - 1));
            const rz = pz - PLOT_D / 2 + 0.8 + ri * ((PLOT_D - 1.2) / (RICE_ROWS - 1));
            ricePositions.push({ x: rx, y: 0, z: rz, golden: isGolden });
          }
        }
      }
    }

    // InstancedMesh: 2 stalk types × 2 geometry = 4 draw calls for all 240 rice plants
    const greenPositions = ricePositions.filter(r => !r.golden);
    const goldPositions = ricePositions.filter(r => r.golden);

    const stalkGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.65, 4);
    const grainGeo = new THREE.SphereGeometry(0.1, 5, 4);
    const stalkGeoGold = new THREE.CylinderGeometry(0.04, 0.05, 0.80, 4);
    const grainGeoGold = new THREE.SphereGeometry(0.1, 5, 4);
    disposables.push(stalkGeo, grainGeo, stalkGeoGold, grainGeoGold);

    const dummyR = new THREE.Object3D();

    [
      { positions: greenPositions, mat: riceMat, sGeo: stalkGeo, gGeo: grainGeo, goldOffset: 0 },
      { positions: goldPositions, mat: riceGoldMat, sGeo: stalkGeoGold, gGeo: grainGeoGold, goldOffset: 0.08 }
    ].forEach(({ positions, mat, sGeo, gGeo, goldOffset }) => {
      if (positions.length === 0) return;
      const stalkIM = new THREE.InstancedMesh(sGeo, mat, positions.length);
      const grainIM = new THREE.InstancedMesh(gGeo, mat, positions.length);
      stalkIM.matrixAutoUpdate = false;
      grainIM.matrixAutoUpdate = false;

      positions.forEach(({ x, z }, i) => {
        dummyR.position.set(x, 0.35, z);
        dummyR.scale.set(1, 1, 1);
        dummyR.rotation.set(0, 0, 0);
        dummyR.updateMatrix();
        stalkIM.setMatrixAt(i, dummyR.matrix);

        dummyR.position.set(x + goldOffset, 0.7, z);
        dummyR.scale.set(1, 0.5, 1);
        dummyR.updateMatrix();
        grainIM.setMatrixAt(i, dummyR.matrix);
      });

      stalkIM.instanceMatrix.needsUpdate = true;
      grainIM.instanceMatrix.needsUpdate = true;
      group.add(stalkIM, grainIM);
    });


    // ─── 2. Irrigation Canal (runs North-South on the West side of field) ───
    const CANAL_W = 2.0;
    const CANAL_LENGTH = 36.0;

    // Canal water surface
    const canalWater = new THREE.Mesh(
      new THREE.PlaneGeometry(CANAL_W, CANAL_LENGTH),
      waterMat
    );
    canalWater.rotation.x = -Math.PI / 2;
    canalWater.position.set(-18, -0.08, 0);
    group.add(canalWater);

    // Canal stone embankment (West bank)
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x7a6650, roughness: 0.9 });
    disposables.push(bankMat);
    [-1.2, 1.2].forEach(bx => {
      const bank = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.3, CANAL_LENGTH),
        bankMat
      );
      bank.position.set(-18 + bx, 0.08, 0);
      group.add(bank);
    });

    // ─── 3. Mini Waterfall (North end of canal) ───
    // Rocky cliff face
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x5a5050, roughness: 0.95 });
    disposables.push(cliffMat);
    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 2.8, 1.5),
      cliffMat
    );
    cliff.position.set(-18, 1.4, -18);
    cliff.castShadow = true;
    group.add(cliff);

    // Waterfall curtain (semi-transparent plane)
    const fallMat = new THREE.MeshStandardMaterial({
      color: 0x80c8e8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    disposables.push(fallMat);
    const waterfall = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      fallMat
    );
    waterfall.position.set(-18, 0.8, -16.9);
    group.add(waterfall);

    // Waterfall spray glow
    const sprayLight = new THREE.PointLight(0x88ccee, 1.0, 8, 1.5);
    sprayLight.position.set(-18, 0.5, -16.5);
    group.add(sprayLight);

    // ─── 4. Three Scarecrows ───
    const scarecrowPositions: [number, number][] = [[-6, -8], [4, 4], [13, -5]];
    scarecrowPositions.forEach(([sx, sz]) => {
      // Vertical post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 2.2, 5),
        bambooMat
      );
      post.position.set(sx, 1.1, sz);
      post.castShadow = true;
      group.add(post);

      // Horizontal arm
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5),
        bambooMat
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(sx, 1.6, sz);
      group.add(arm);

      // Straw body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 0.55, 6),
        strawMat
      );
      body.position.set(sx, 1.5, sz);
      group.add(body);

      // Head (gourd shape)
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 7, 6),
        strawMat
      );
      head.scale.set(1, 1.2, 1);
      head.position.set(sx, 2.08, sz);
      group.add(head);

      // Straw hat
      const hatBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.06, 8),
        strawMat
      );
      hatBrim.position.set(sx, 2.32, sz);
      group.add(hatBrim);

      const hatTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.36, 0.32, 8),
        strawMat
      );
      hatTop.position.set(sx, 2.5, sz);
      group.add(hatTop);

      // Dangling rope strips
      [-0.55, 0.55].forEach(ox => {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.55, 0.04),
          ropeMat
        );
        strip.position.set(sx + ox, 1.28, sz);
        group.add(strip);
      });
    });

    // ─── 5. Bamboo Fence Border (North & South perimeter) ───
    const fenceLength = 38;
    const postSpacing = 2.2;

    [-14.5, 14.5].forEach(fz => {
      for (let fi = 0; fi < Math.floor(fenceLength / postSpacing); fi++) {
        const fx = -19 + fi * postSpacing;

        const fpost = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.11, 1.4, 5),
          bambooMat
        );
        fpost.position.set(fx, 0.7, fz);
        group.add(fpost);

        if (fi < Math.floor(fenceLength / postSpacing) - 1) {
          const rail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, postSpacing, 4),
            bambooMat
          );
          rail.rotation.z = Math.PI / 2;
          rail.position.set(fx + postSpacing / 2, 1.05, fz);
          group.add(rail);

          const lowerRail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, postSpacing, 4),
            bambooMat
          );
          lowerRail.rotation.z = Math.PI / 2;
          lowerRail.position.set(fx + postSpacing / 2, 0.45, fz);
          group.add(lowerRail);
        }
      }
    });

    // ─── 6. Oil Lamp Posts along canal path ───
    const lampPositions: number[] = [-14, -7, 0, 7, 14];
    lampPositions.forEach(lz => {
      const lampPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 2.0, 6),
        bambooMat
      );
      lampPost.position.set(-16.5, 1.0, lz);
      group.add(lampPost);

      const lantern = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.36, 0.28),
        lanternGlowMat
      );
      lantern.position.set(-16.5, 2.15, lz);
      group.add(lantern);

      const lampLight = new THREE.PointLight(0xffbb44, 0.8, 6.0, 1.8);
      lampLight.position.set(-16.5, 2.1, lz);
      group.add(lampLight);
    });

    // ─── 7. Wooden Footbridge Over Canal ───
    const bridgeDeck = new THREE.Mesh(
      new THREE.BoxGeometry(CANAL_W + 0.6, 0.14, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x7a4f2e, roughness: 0.75 })
    );
    bridgeDeck.position.set(-18, 0.22, 4);
    bridgeDeck.castShadow = true;
    group.add(bridgeDeck);

    // Bridge handrails
    [-1.15, 1.15].forEach(bx => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.6, 2.4),
        bambooMat
      );
      rail.position.set(-18 + bx, 0.6, 4);
      group.add(rail);
    });

    return group;
  }
}
