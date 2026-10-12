import * as THREE from 'three';

export interface WindmillBuildResult {
  hillGroup: THREE.Group;
  windmillBladesGroup: THREE.Group;
}

/**
 * WindmillBuilder
 * Constructs South-East Dutch Heritage Windmill Hill
 * Features:
 * 1. Deep Sub-Surface Masonry Foundation Plinth (anchored 2.8m deep into hill slopes, 0% floating)
 * 2. Stepped Flagstone Terrace & Arrival Steps connecting directly from stone pathway
 * 3. Rustic Wooden Railing with cross-bracing
 * 4. Octagonal Tapered Stone Masonry Lower Tower with Arched Timber Door & Wall Lantern
 * 5. Mid-Tower Observation Balcony / Catwalk Gallery with wooden corbels & railing
 * 6. Upper Cedar Weatherboard Timber Body with framed glass windows
 * 7. Conical Cedar Cap Roof with ornamental finial spire & rear auxiliary fantail
 * 8. Player-Facing High-Detail 4-Blade Lattice Sails with timber spars, lattice ribs & canvas cloths
 */
export class WindmillBuilder {
  public static build(
    disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]
  ): WindmillBuildResult {
    const hillGroup = new THREE.Group();
    // Anchor hillGroup at y = 0 world coordinates for deterministic, rock-solid grounding
    hillGroup.position.set(38, 0, 40);

    // Architectural Material Palette
    const subStoneMat = new THREE.MeshStandardMaterial({ color: 0x48423a, roughness: 0.95 });
    const terraceStoneMat = new THREE.MeshStandardMaterial({ color: 0x7c7366, roughness: 0.88 });
    const towerStoneMat = new THREE.MeshStandardMaterial({ color: 0x8f8476, roughness: 0.85 });
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x3d2616, roughness: 0.8 });
    const timberCedarMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.75 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xede8d0, roughness: 0.6 });
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.75
    });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const sailClothMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e1, roughness: 0.6, side: THREE.DoubleSide });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffa000,
      emissiveIntensity: 0.8
    });

    disposables.push(
      subStoneMat, terraceStoneMat, towerStoneMat, timberDarkMat,
      timberCedarMat, trimMat, windowGlassMat, ironMat, sailClothMat, lanternGlowMat
    );

    // 1. DEEP SUB-SURFACE FOUNDATION PLINTH (Anchored from y = 1.0m to 4.2m)
    const subPlinthGeo = new THREE.CylinderGeometry(4.6, 4.9, 3.2, 16);
    disposables.push(subPlinthGeo);
    const subPlinth = new THREE.Mesh(subPlinthGeo, subStoneMat);
    subPlinth.position.y = 2.4;
    subPlinth.receiveShadow = true;
    hillGroup.add(subPlinth);

    // Terrace Upper Plinth & Curb (Spans y: 3.9m to 4.7m)
    const terracePlinthGeo = new THREE.CylinderGeometry(4.2, 4.6, 0.8, 16);
    disposables.push(terracePlinthGeo);
    const terracePlinth = new THREE.Mesh(terracePlinthGeo, terraceStoneMat);
    terracePlinth.position.y = 4.3;
    terracePlinth.receiveShadow = true;
    hillGroup.add(terracePlinth);

    // Flagstone Terrace Floor Slab (Radius 4.15m, top face at y = 4.78m)
    const terraceFloorGeo = new THREE.CylinderGeometry(4.15, 4.15, 0.14, 16);
    disposables.push(terraceFloorGeo);
    const terraceFloor = new THREE.Mesh(terraceFloorGeo, terraceStoneMat);
    terraceFloor.position.y = 4.72;
    terraceFloor.receiveShadow = true;
    hillGroup.add(terraceFloor);

    // 2. ARRIVAL STEPS & TERRACE PERIMETER RAILING (Connecting from Path 3)
    const arrivalAngle = -Math.PI * 0.75; // Direction facing incoming player path
    const arrivalGroup = new THREE.Group();
    arrivalGroup.rotation.y = arrivalAngle;

    // 3 Curved Stone Arrival Steps descending from y = 4.7m down to 4.0m
    [
      { width: 2.4, height: 0.22, depth: 1.0, y: 4.56, z: 3.8 },
      { width: 2.7, height: 0.22, depth: 1.0, y: 4.34, z: 4.6 },
      { width: 3.0, height: 0.22, depth: 1.1, y: 4.12, z: 5.4 }
    ].forEach(st => {
      const stepGeo = new THREE.BoxGeometry(st.width, st.height, st.depth);
      disposables.push(stepGeo);
      const step = new THREE.Mesh(stepGeo, terraceStoneMat);
      step.position.set(0, st.y, st.z);
      step.receiveShadow = true;
      arrivalGroup.add(step);
    });
    hillGroup.add(arrivalGroup);

    // Terrace Perimeter Wooden Railing
    const railPostCount = 14;
    const railRadius = 4.02;
    for (let r = 0; r < railPostCount; r++) {
      const pAngle = (r / railPostCount) * Math.PI * 2;
      let diffAngle = Math.abs(pAngle - (arrivalAngle + Math.PI * 2) % (Math.PI * 2));
      if (diffAngle > Math.PI) diffAngle = Math.PI * 2 - diffAngle;
      if (diffAngle < 0.42) continue;

      const px = Math.cos(pAngle) * railRadius;
      const pz = Math.sin(pAngle) * railRadius;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), timberDarkMat);
      post.position.set(px, 5.15, pz);
      post.castShadow = true;
      hillGroup.add(post);
    }

    // Circular Top Rail Ring
    const railRingGeo = new THREE.TorusGeometry(railRadius, 0.045, 6, 24);
    disposables.push(railRingGeo);
    const railRing = new THREE.Mesh(railRingGeo, timberDarkMat);
    railRing.rotation.x = Math.PI / 2;
    railRing.position.y = 5.5;
    hillGroup.add(railRing);

    // 3. OCTAGONAL LOWER STONE TOWER
    const towerGeo = new THREE.CylinderGeometry(1.8, 2.25, 5.1, 8);
    disposables.push(towerGeo);
    const tower = new THREE.Mesh(towerGeo, towerStoneMat);
    tower.position.y = 7.25;
    tower.castShadow = true;
    tower.receiveShadow = true;
    hillGroup.add(tower);

    // Arched Timber Entrance Doorway
    const doorGroup = new THREE.Group();
    doorGroup.rotation.y = arrivalAngle;

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 0.25), timberDarkMat);
    doorFrame.position.set(0, 5.85, 2.15);
    doorGroup.add(doorFrame);

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.1, 0.15), timberCedarMat);
    doorPanel.position.set(0, 5.85, 2.22);
    doorGroup.add(doorPanel);

    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), ironMat);
    doorKnob.position.set(0.38, 5.85, 2.30);
    doorGroup.add(doorKnob);

    const lanternBracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.35), ironMat);
    lanternBracket.position.set(0.85, 6.25, 2.15);
    doorGroup.add(lanternBracket);

    const lanternCage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), ironMat);
    lanternCage.position.set(0.85, 6.15, 2.38);
    doorGroup.add(lanternCage);

    const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lanternGlowMat);
    lanternBulb.position.set(0.85, 6.15, 2.38);
    doorGroup.add(lanternBulb);

    hillGroup.add(doorGroup);

    // Mid-tower Windows
    [-Math.PI / 2, Math.PI / 2].forEach(wRot => {
      const winGroup = new THREE.Group();
      winGroup.rotation.y = wRot;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.25, 0.2), trimMat);
      frame.position.set(0, 8.2, 2.45);
      winGroup.add(frame);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 1.05), windowGlassMat);
      glass.position.set(0, 8.2, 2.56);
      winGroup.add(glass);

      hillGroup.add(winGroup);
    });

    // 4. MID-TOWER CATWALK GALLERY
    const galleryDeckGeo = new THREE.CylinderGeometry(3.1, 3.1, 0.16, 16);
    disposables.push(galleryDeckGeo);
    const galleryDeck = new THREE.Mesh(galleryDeckGeo, timberDarkMat);
    galleryDeck.position.y = 9.8;
    galleryDeck.castShadow = true;
    hillGroup.add(galleryDeck);

    // Cantilevered Timber Corbel Brackets
    for (let c = 0; c < 8; c++) {
      const cAngle = (c / 8) * Math.PI * 2;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.75), timberDarkMat);
      bracket.position.set(Math.cos(cAngle) * 2.5, 9.42, Math.sin(cAngle) * 2.5);
      bracket.rotation.y = cAngle;
      hillGroup.add(bracket);
    }

    // Gallery Balcony Perimeter Railing
    const balcPostCount = 12;
    for (let bp = 0; bp < balcPostCount; bp++) {
      const bpAngle = (bp / balcPostCount) * Math.PI * 2;
      const bPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), timberDarkMat);
      bPost.position.set(Math.cos(bpAngle) * 2.95, 10.3, Math.sin(bpAngle) * 2.95);
      hillGroup.add(bPost);
    }

    const balcRingGeo = new THREE.TorusGeometry(2.95, 0.04, 6, 20);
    disposables.push(balcRingGeo);
    const balcRing = new THREE.Mesh(balcRingGeo, timberDarkMat);
    balcRing.rotation.x = Math.PI / 2;
    balcRing.position.y = 10.7;
    hillGroup.add(balcRing);

    // 5. UPPER TIMBER TOWER BODY
    const upperTowerGeo = new THREE.CylinderGeometry(1.7, 2.15, 3.0, 8);
    disposables.push(upperTowerGeo);
    const upperTower = new THREE.Mesh(upperTowerGeo, timberCedarMat);
    upperTower.position.y = 11.3;
    upperTower.castShadow = true;
    hillGroup.add(upperTower);

    // Decorative White Trim Ring
    const trimRing = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.16, 12), trimMat);
    trimRing.position.y = 12.85;
    hillGroup.add(trimRing);

    // 6. ROTATING CAP ROOF & LATTICE SAILS
    const capAssembly = new THREE.Group();
    capAssembly.position.y = 12.9;
    capAssembly.rotation.y = arrivalAngle;

    const capRoofGeo = new THREE.ConeGeometry(2.15, 2.5, 8);
    disposables.push(capRoofGeo);
    const capRoof = new THREE.Mesh(capRoofGeo, timberDarkMat);
    capRoof.position.y = 1.25;
    capRoof.castShadow = true;
    capAssembly.add(capRoof);

    const spireGeo = new THREE.CylinderGeometry(0.05, 0.16, 1.3, 6);
    disposables.push(spireGeo);
    const spire = new THREE.Mesh(spireGeo, trimMat);
    spire.position.y = 2.9;
    capAssembly.add(spire);

    // Rear Auxiliary Fantail
    const fantailPole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), timberDarkMat);
    fantailPole.position.set(0, 0.9, -1.9);
    capAssembly.add(fantailPole);

    const fantailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 8), ironMat);
    fantailHub.position.set(0, 0.9, -2.6);
    fantailHub.rotation.x = Math.PI / 2;
    capAssembly.add(fantailHub);

    for (let f = 0; f < 6; f++) {
      const fAngle = (f / 6) * Math.PI * 2;
      const fBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.02), trimMat);
      fBlade.position.set(Math.sin(fAngle) * 0.35, 0.9 + Math.cos(fAngle) * 0.35, -2.6);
      fBlade.rotation.z = -fAngle;
      capAssembly.add(fBlade);
    }

    // Cast-iron Forward Rotor Axle Housing
    const axleHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.9, 12), ironMat);
    axleHousing.rotation.x = Math.PI / 2;
    axleHousing.position.set(0, 0.85, 1.55);
    capAssembly.add(axleHousing);

    // Rotor Axle Hub (Dynamic Rotating Group)
    const windmillBladesGroup = new THREE.Group();
    windmillBladesGroup.position.set(0, 0.85, 2.0);

    const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12), ironMat);
    hubMesh.rotation.x = Math.PI / 2;
    windmillBladesGroup.add(hubMesh);

    // 4 High-Detail Lattice Sails
    const bladeArmGeo = new THREE.BoxGeometry(0.16, 6.2, 0.16);
    const sailCanvasGeo = new THREE.PlaneGeometry(1.25, 3.4);
    disposables.push(bladeArmGeo, sailCanvasGeo);

    for (let b = 0; b < 4; b++) {
      const bAngle = (b * Math.PI) / 2;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = bAngle;

      const spar = new THREE.Mesh(bladeArmGeo, timberCedarMat);
      spar.position.y = 3.1;
      spar.castShadow = true;
      bladeArm.add(spar);

      for (let rib = 0; rib < 5; rib++) {
        const ribY = 1.8 + rib * 0.85;
        const ribMesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.06), timberDarkMat);
        ribMesh.position.set(0.65, ribY, 0.02);
        ribMesh.castShadow = true;
        bladeArm.add(ribMesh);
      }

      const sailCloth = new THREE.Mesh(sailCanvasGeo, sailClothMat);
      sailCloth.position.set(0.68, 3.5, 0.06);
      sailCloth.castShadow = true;
      bladeArm.add(sailCloth);

      windmillBladesGroup.add(bladeArm);
    }

    capAssembly.add(windmillBladesGroup);
    hillGroup.add(capAssembly);

    return { hillGroup, windmillBladesGroup };
  }
}
