import * as THREE from 'three';

/**
 * HarvestBazaarBuilder
 * Constructs the South-Center Pasar Panen Terbuka / Harvest Bazaar zone (x∈[-30,30], z∈[60,100])
 * Features: 6 colorful market stalls with produce displays, central ornamental fountain,
 * hanging flag banners, decorative lantern arches, market crowd ambience via prop density,
 * cobblestone plaza, and warm festive lighting.
 * Zone center: (0, 0, 80)
 */
export class HarvestBazaarBuilder {
  public static build(
    disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0, 80); // zone center

    // ─── Shared Materials ───
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a4f2e, roughness: 0.78 });
    const cobbleMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.92 });
    const fountainMat = new THREE.MeshStandardMaterial({
      color: 0xb0a090,
      roughness: 0.75,
      metalness: 0.05
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3388cc,
      roughness: 0.05,
      metalness: 0.2,
      transparent: true,
      opacity: 0.75
    });
    const produceMats: Record<string, THREE.MeshStandardMaterial> = {
      tomato: new THREE.MeshStandardMaterial({ color: 0xe01c1c, roughness: 0.35 }),
      corn: new THREE.MeshStandardMaterial({ color: 0xf5c842, roughness: 0.55 }),
      pepper: new THREE.MeshStandardMaterial({ color: 0xff4e20, roughness: 0.4 }),
      eggplant: new THREE.MeshStandardMaterial({ color: 0x7b1fa2, roughness: 0.45 }),
      pumpkin: new THREE.MeshStandardMaterial({ color: 0xff7043, roughness: 0.5 }),
      herb: new THREE.MeshStandardMaterial({ color: 0x33a852, roughness: 0.7 }),
    };

    // Stall awning colors (vivid festive palette)
    const awningColors = [0xe53935, 0xfdd835, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa];
    const awningMats = awningColors.map(c => {
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
      disposables.push(m);
      return m;
    });

    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe566,
      emissive: 0xffcc00,
      emissiveIntensity: 1.6
    });
    const redLanternMat = new THREE.MeshStandardMaterial({
      color: 0xff3322,
      emissive: 0xff1100,
      emissiveIntensity: 1.2
    });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    const flagColors = [0xff4444, 0xffcc00, 0x44bb44, 0x4488ff, 0xff8800];
    const flagMats = flagColors.map(c => {
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, side: THREE.DoubleSide });
      disposables.push(m);
      return m;
    });

    disposables.push(
      woodMat, cobbleMat, fountainMat, waterMat,
      ...Object.values(produceMats), lanternGlowMat, redLanternMat, ropeMat
    );

    // ─── 1. Cobblestone Plaza Base ───
    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(62, 44),
      cobbleMat
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.06, 0);
    plaza.receiveShadow = true;
    group.add(plaza);

    // ─── 2. Six Market Stalls ───
    const STALL_W = 5.5;
    const STALL_D = 4.0;
    const COUNTER_H = 1.0;

    const stallLayout: { x: number; z: number; rotY: number; produce: string }[] = [
      // Left row (facing East)
      { x: -22, z: -12, rotY: 0, produce: 'tomato' },
      { x: -22, z:   0, rotY: 0, produce: 'corn' },
      { x: -22, z:  12, rotY: 0, produce: 'pepper' },
      // Right row (facing West)
      { x:  22, z: -12, rotY: Math.PI, produce: 'eggplant' },
      { x:  22, z:   0, rotY: Math.PI, produce: 'pumpkin' },
      { x:  22, z:  12, rotY: Math.PI, produce: 'herb' },
    ];

    stallLayout.forEach(({ x, z, rotY, produce }, idx) => {
      const stallGroup = new THREE.Group();
      stallGroup.position.set(x, 0, z);
      stallGroup.rotation.y = rotY;

      // Counter / table
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(STALL_W, COUNTER_H, STALL_D * 0.45),
        woodMat
      );
      counter.position.set(0, COUNTER_H / 2, STALL_D * 0.2);
      counter.castShadow = true;
      counter.receiveShadow = true;
      stallGroup.add(counter);

      // Back wall of stall
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(STALL_W, 2.8, 0.2),
        woodMat
      );
      backWall.position.set(0, 1.4, -STALL_D * 0.45);
      stallGroup.add(backWall);

      // Side walls
      [-STALL_W / 2, STALL_W / 2].forEach(wx => {
        const sideWall = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 2.8, STALL_D),
          woodMat
        );
        sideWall.position.set(wx, 1.4, 0);
        stallGroup.add(sideWall);
      });

      // 4 Corner support posts
      [[-STALL_W / 2, -STALL_D * 0.45], [-STALL_W / 2, STALL_D * 0.45],
       [STALL_W / 2, -STALL_D * 0.45], [STALL_W / 2, STALL_D * 0.45]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.12, 3.4, 6),
          woodMat
        );
        post.position.set(px, 1.7, pz);
        stallGroup.add(post);
      });

      // Colorful awning roof (sloped)
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(STALL_W + 1.0, 0.12, STALL_D + 1.0),
        awningMats[idx]
      );
      awning.position.set(0.2, 3.25, 0.0);
      awning.rotation.x = -0.12; // slight slope
      awning.castShadow = true;
      stallGroup.add(awning);

      // Awning fringe (strip below front edge)
      const fringe = new THREE.Mesh(
        new THREE.BoxGeometry(STALL_W + 1.0, 0.28, 0.08),
        awningMats[idx]
      );
      fringe.position.set(0.2, 2.9, STALL_D * 0.5 + 0.36);
      stallGroup.add(fringe);

      // Produce display on counter
      const prodMat = produceMats[produce];
      const produceItems = produce === 'corn' ? 5 : 7;
      for (let p = 0; p < produceItems; p++) {
        let produceItem: THREE.Mesh;
        const px = -STALL_W / 2 + 0.6 + p * ((STALL_W - 1.0) / (produceItems - 1));

        if (produce === 'corn') {
          // Corn cob (elongated cylinder)
          produceItem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.12, 0.65, 6),
            prodMat
          );
          produceItem.rotation.z = 0.3;
        } else if (produce === 'eggplant' || produce === 'pepper') {
          // Elongated sphere
          produceItem = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 6, 5),
            prodMat
          );
          produceItem.scale.set(0.7, 1.4, 0.7);
        } else {
          // Round produce
          produceItem = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 7, 6),
            prodMat
          );
        }
        produceItem.position.set(px, COUNTER_H + 0.2, STALL_D * 0.2);
        stallGroup.add(produceItem);
      }

      // Wicker basket on counter
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.28, 0.45, 8, 1, true),
        woodMat
      );
      basket.position.set(STALL_W / 2 - 0.55, COUNTER_H + 0.22, STALL_D * 0.2);
      stallGroup.add(basket);

      // Stall sign board
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.55, 0.08),
        woodMat
      );
      sign.position.set(0, 3.65, -STALL_D * 0.45 + 0.06);
      stallGroup.add(sign);

      group.add(stallGroup);
    });

    // ─── 3. Central Ornamental Fountain ───
    // Basin
    const basinGeo = new THREE.CylinderGeometry(3.2, 3.5, 0.55, 12);
    disposables.push(basinGeo);
    const basin = new THREE.Mesh(basinGeo, fountainMat);
    basin.position.set(0, 0.28, 0);
    basin.castShadow = true;
    basin.receiveShadow = true;
    group.add(basin);

    // Water in basin
    const basinWater = new THREE.Mesh(
      new THREE.CircleGeometry(2.9, 12),
      waterMat
    );
    basinWater.rotation.x = -Math.PI / 2;
    basinWater.position.set(0, 0.52, 0);
    group.add(basinWater);

    // Center column
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.35, 1.8, 8),
      fountainMat
    );
    column.position.set(0, 1.17, 0);
    column.castShadow = true;
    group.add(column);

    // Upper basin (tiered)
    const upperBasin = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.28, 10),
      fountainMat
    );
    upperBasin.position.set(0, 2.05, 0);
    group.add(upperBasin);

    // Fountain spout water streams (4 arching planes)
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    disposables.push(streamMat);
    for (let s = 0; s < 4; s++) {
      const streamAngle = (s / 4) * Math.PI * 2;
      const stream = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18, 1.4),
        streamMat
      );
      stream.position.set(
        Math.cos(streamAngle) * 0.8,
        1.75,
        Math.sin(streamAngle) * 0.8
      );
      stream.rotation.y = streamAngle;
      stream.rotation.x = 0.35;
      group.add(stream);
    }

    // Fountain central PointLight
    const fountainLight = new THREE.PointLight(0x66ccff, 1.8, 12, 1.5);
    fountainLight.position.set(0, 2.2, 0);
    group.add(fountainLight);

    // ─── 4. Flag & Lantern Arch (between stalls) ───
    // Rope lines with hanging flags
    const ARCH_Z_POSITIONS = [-6, 0, 6];
    ARCH_Z_POSITIONS.forEach(az => {
      // Horizontal rope from left to right stalls
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 46, 4),
        ropeMat
      );
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, 3.8, az);
      group.add(rope);

      // Hanging flags
      for (let fi = 0; fi < 8; fi++) {
        const fx = -20 + fi * 5.8;
        const flagMat = flagMats[fi % flagMats.length];
        const flag = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7, 0.55),
          flagMat
        );
        flag.position.set(fx, 3.4, az);
        flag.rotation.x = 0.15;
        group.add(flag);
      }

      // Red lanterns on rope
      for (let li = 0; li < 4; li++) {
        const lx = -15 + li * 10;
        const lantern = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.42, 7),
          redLanternMat
        );
        lantern.position.set(lx, 3.3, az);
        group.add(lantern);
      }
    });

    // ─── 5. Decorative Entry Gate (South entrance from meadow) ───
    // Two wooden gate posts
    [-4.5, 4.5].forEach(gx => {
      const gatePost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.32, 5.2, 8),
        woodMat
      );
      gatePost.position.set(gx, 2.6, -22);
      gatePost.castShadow = true;
      group.add(gatePost);

      // Post cap ornament (emissive glow)
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 7, 6),
        lanternGlowMat
      );
      cap.position.set(gx, 5.38, -22);
      group.add(cap);
    });

    // Gate crossbeam
    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.4, 0.35),
      woodMat
    );
    gate.position.set(0, 4.8, -22);
    gate.castShadow = true;
    group.add(gate);

    return group;
  }
}
