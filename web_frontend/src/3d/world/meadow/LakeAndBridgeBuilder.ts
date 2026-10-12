import * as THREE from 'three';
import { ProceduralTextures } from '../ProceduralTextures';

/**
 * LakeAndBridgeBuilder
 * Constructs South-West Irrigation Lake with water surface, blooming lotus pads,
 * Grand Full-Span Botanical Arch Bridge, and Central Lotus Gazebo Pavilion.
 */
export class LakeAndBridgeBuilder {
  public static build(disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]): THREE.Group {
    const lakeGroup = new THREE.Group();
    lakeGroup.position.set(-35, 0, 35);

    // 1. Reflective translucent water plane (y = -0.15)
    const waterGeo = new THREE.CircleGeometry(20, 32);
    waterGeo.rotateX(-Math.PI / 2);
    disposables.push(waterGeo);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1d70b8,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82
    });
    disposables.push(waterMat);

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -0.15;
    lakeGroup.add(waterMesh);

    // 2. Floating Notched Lily Pads & Blooming Multi-Petal Lotus Flowers
    const padMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.35 });
    const petalWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfdf2f8, roughness: 0.3 });
    const stamenMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.4 });
    disposables.push(padMat, petalMat, petalWhiteMat, stamenMat);

    const padPositions = [
      [-7, -10], [9, -11], [-11, -3], [12, -4],
      [-9, 8], [11, 7], [-8, 14], [8, 13],
      [-13, 2], [14, 1], [-5, -15], [6, 16]
    ];

    padPositions.forEach(([px, pz]) => {
      // Notched circular lily pad
      const padGeo = new THREE.CircleGeometry(1.05, 16, 0.3, Math.PI * 1.85);
      padGeo.rotateX(-Math.PI / 2);
      disposables.push(padGeo);

      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, -0.13, pz);
      lakeGroup.add(pad);

      // Layered blooming lotus flower
      const lotusGroup = new THREE.Group();
      lotusGroup.position.set(px, -0.05, pz);

      // 6 Outer pink petals
      for (let p = 0; p < 6; p++) {
        const ang = (p * Math.PI) / 3;
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 5), petalMat);
        petal.position.set(Math.cos(ang) * 0.16, 0.12, Math.sin(ang) * 0.16);
        petal.rotation.x = Math.sin(ang) * 0.4;
        petal.rotation.z = -Math.cos(ang) * 0.4;
        lotusGroup.add(petal);
      }

      // 4 Inner white-pink petals
      for (let ip = 0; ip < 4; ip++) {
        const iang = (ip * Math.PI) / 2 + 0.3;
        const inPetal = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 5), petalWhiteMat);
        inPetal.position.set(Math.cos(iang) * 0.08, 0.14, Math.sin(iang) * 0.08);
        inPetal.rotation.x = Math.sin(iang) * 0.25;
        inPetal.rotation.z = -Math.cos(iang) * 0.25;
        lotusGroup.add(inPetal);
      }

      // Golden stamen center
      const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), stamenMat);
      stamen.position.set(0, 0.16, 0);
      lotusGroup.add(stamen);

      lakeGroup.add(lotusGroup);
    });

    // 3. Shared Architectural Materials with Procedural PBR Textures
    const woodTex = ProceduralTextures.createWoodPlankTexture(512, 512);
    const stoneTex = ProceduralTextures.createStoneWallTexture(512, 512);
    disposables.push(woodTex, stoneTex);

    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x3d200e, roughness: 0.8 });
    const woodDeckMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65, metalness: 0.05 });
    const stonePlinthMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.88 });
    const cedarRoofMat = new THREE.MeshStandardMaterial({ color: 0x6b2b18, roughness: 0.7 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      emissive: 0xff9900,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    disposables.push(timberDarkMat, woodDeckMat, stonePlinthMat, cedarRoofMat, brassMat, lanternGlowMat);

    // 4. Central Lotus Gazebo Island (at center x=0, z=0)
    // Deep underwater dressed stone foundation plinth
    const plinthGeo = new THREE.CylinderGeometry(4.7, 5.0, 1.2, 8);
    disposables.push(plinthGeo);
    const plinth = new THREE.Mesh(plinthGeo, stonePlinthMat);
    plinth.position.y = -0.12;
    plinth.receiveShadow = true;
    lakeGroup.add(plinth);

    // Octagonal wooden gazebo floor deck (y=0.45)
    const gazeboDeckGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, 8);
    disposables.push(gazeboDeckGeo);
    const gazeboDeck = new THREE.Mesh(gazeboDeckGeo, woodDeckMat);
    gazeboDeck.position.y = 0.45;
    gazeboDeck.receiveShadow = true;
    lakeGroup.add(gazeboDeck);

    // 8 Elegant Wooden Columns (Elevated height 3.5m for airy, majestic cathedral view)
    const columnGeo = new THREE.BoxGeometry(0.24, 3.5, 0.24);
    disposables.push(columnGeo);
    for (let c = 0; c < 8; c++) {
      const colAngle = (c * Math.PI) / 4;
      const colX = Math.cos(colAngle) * 3.85;
      const colZ = Math.sin(colAngle) * 3.85;

      const column = new THREE.Mesh(columnGeo, timberDarkMat);
      column.position.set(colX, 2.2, colZ);
      column.castShadow = true;
      lakeGroup.add(column);

      // Decorative top bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.35), brassMat);
      bracket.position.set(colX, 3.9, colZ);
      lakeGroup.add(bracket);
    }

    // Gazebo Octagonal Conical Cedar Roof (Airy & Elevated: Base y=3.95, Height 2.5m, Peak y=6.45m)
    const roofGeo = new THREE.ConeGeometry(5.2, 2.5, 8);
    disposables.push(roofGeo);
    const roof = new THREE.Mesh(roofGeo, cedarRoofMat);
    roof.position.y = 5.2;
    roof.castShadow = true;
    lakeGroup.add(roof);

    // Roof Spire Finial
    const finialGeo = new THREE.ConeGeometry(0.18, 1.0, 6);
    disposables.push(finialGeo);
    const finial = new THREE.Mesh(finialGeo, brassMat);
    finial.position.y = 6.95;
    lakeGroup.add(finial);

    // Central Brass Hanging Chandelier with actual PointLight!
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 4), brassMat);
    chain.position.set(0, 4.3, 0);
    lakeGroup.add(chain);

    const chandelier = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.48), lanternGlowMat);
    chandelier.position.set(0, 3.6, 0);
    lakeGroup.add(chandelier);

    // Warm Gazebo Island Chandelier Point Light
    const gazeboLight = new THREE.PointLight(0xffd166, 1.8, 14, 1.2);
    gazeboLight.position.set(0, 3.4, 0);
    lakeGroup.add(gazeboLight);

    // Gazebo Observation Benches (East & West sides facing lotus flowers)
    [-2.7, 2.7].forEach(bx => {
      const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2.4), woodDeckMat);
      benchSeat.position.set(bx, 0.82, 0);
      benchSeat.castShadow = true;
      lakeGroup.add(benchSeat);

      const benchBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 2.4), timberDarkMat);
      benchBack.position.set(bx > 0 ? bx + 0.22 : bx - 0.22, 1.05, 0);
      lakeGroup.add(benchBack);
    });

    // Perimeter Railing on Gazebo with North & South bridge access portals
    for (let r = 0; r < 8; r++) {
      if (r === 2 || r === 6) continue;
      const midAngle = (r + 0.5) * (Math.PI / 4);
      const rx = Math.cos(midAngle) * 3.85;
      const rz = Math.sin(midAngle) * 3.85;

      const railSegment = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 0.12), timberDarkMat);
      railSegment.position.set(rx, 1.25, rz);
      railSegment.rotation.y = -midAngle + Math.PI / 2;
      railSegment.castShadow = true;
      lakeGroup.add(railSegment);
    }

    // Transitional Newel Posts at North & South portals (Smooth bridge-gazebo gateway)
    [-1.85, 1.85].forEach(gx => {
      [-4.0, 4.0].forEach(gz => {
        const portalPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), timberDarkMat);
        portalPost.position.set(gx, 1.05, gz);
        lakeGroup.add(portalPost);

        const postCap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), brassMat);
        postCap.position.set(gx, 1.68, gz);
        lakeGroup.add(postCap);
      });
    });

    // 5. Arched Wooden Bridge Spans (North: z=-18 to -4.5, South: z=+4.5 to +18)
    const createBridgeSpan = (isNorth: boolean) => {
      const zStart = isNorth ? -18.0 : 4.5;
      const spanLength = 13.5;
      const segments = 8;
      const segLength = spanLength / segments;

      // Segmented Arched Walkway Deck
      for (let s = 0; s < segments; s++) {
        const segZ = zStart + (s + 0.5) * segLength;
        const norm = isNorth ? (segZ - (-18.0)) / spanLength : (segZ - 4.5) / spanLength;
        const baseSlope = isNorth ? 0.28 + (0.45 - 0.28) * norm : 0.45 - (0.45 - 0.28) * norm;
        const archY = baseSlope + Math.sin(norm * Math.PI) * 0.24;

        const deckSeg = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, segLength + 0.08), woodDeckMat);
        deckSeg.position.set(0, archY, segZ);
        deckSeg.castShadow = true;
        deckSeg.receiveShadow = true;
        lakeGroup.add(deckSeg);

        // Arched Handrail Segments (West & East) following exact deck curve!
        [-1.75, 1.75].forEach(rx => {
          const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, segLength + 0.06), timberDarkMat);
          topRail.position.set(rx, archY + 0.85, segZ);
          topRail.castShadow = true;
          lakeGroup.add(topRail);

          const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, segLength + 0.06), timberDarkMat);
          midRail.position.set(rx, archY + 0.45, segZ);
          lakeGroup.add(midRail);

          // Vertical Baluster post at segment joint
          const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.12), timberDarkMat);
          baluster.position.set(rx, archY + 0.48, segZ);
          baluster.castShadow = true;
          lakeGroup.add(baluster);
        });
      }

      // Submerged Timber Pilings into Lake Bed
      [-9.0, -15.0].forEach(pzRel => {
        const pz = isNorth ? pzRel : -pzRel;
        [-1.6, 1.6].forEach(px => {
          const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.9, 8), stonePlinthMat);
          piling.position.set(px, -0.4, pz);
          piling.castShadow = true;
          lakeGroup.add(piling);
        });

        const crossTie = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.18), timberDarkMat);
        crossTie.position.set(0, 0.1, pz);
        lakeGroup.add(crossTie);
      });

      // Mid-Span Brass Lantern Posts over the lake water
      const midSpanZ = isNorth ? -11.25 : 11.25;
      [-1.75, 1.75].forEach(lx => {
        const lanternPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), timberDarkMat);
        lanternPost.position.set(lx, 1.25, midSpanZ);
        lakeGroup.add(lanternPost);

        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.24), lanternGlowMat);
        lantern.position.set(lx, 2.0, midSpanZ);
        lakeGroup.add(lantern);

        const bridgeLight = new THREE.PointLight(0xffaa44, 0.9, 8.0, 1.5);
        bridgeLight.position.set(lx, 2.0, midSpanZ);
        lakeGroup.add(bridgeLight);
      });

      // Entrance Brass Lanterns on corner shore posts
      const entranceZ = isNorth ? -18.0 : 18.0;
      [-1.75, 1.75].forEach(lx => {
        const lanternPost = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), timberDarkMat);
        lanternPost.position.set(lx, 0.98, entranceZ);
        lakeGroup.add(lanternPost);

        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.24), lanternGlowMat);
        lantern.position.set(lx, 1.78, entranceZ);
        lakeGroup.add(lantern);
      });
    };

    createBridgeSpan(true);  // North Span
    createBridgeSpan(false); // South Span

    // 6. Shoreline Approach Ramps (North: z=-21.5 to -18.0, South: z=+18.0 to +21.5)
    // North Approach Ramp (Slopes from 0.08m at shore z=-21.5 to 0.28m at bridge start z=-18.0)
    const northRamp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 3.6), woodDeckMat);
    northRamp.position.set(0, 0.18, -19.75);
    northRamp.rotation.x = -0.057;
    northRamp.castShadow = true;
    northRamp.receiveShadow = true;
    lakeGroup.add(northRamp);

    // South Approach Ramp (Slopes from 0.28m at bridge end z=+18.0 to 0.08m at shore z=+21.5)
    const southRamp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 3.6), woodDeckMat);
    southRamp.position.set(0, 0.18, 19.75);
    southRamp.rotation.x = 0.057;
    southRamp.castShadow = true;
    southRamp.receiveShadow = true;
    lakeGroup.add(southRamp);

    return lakeGroup;
  }
}
